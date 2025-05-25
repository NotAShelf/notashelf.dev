use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize, Clone)]
pub struct PostData {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub keywords: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub score: f32,
    pub title_match: bool,
    pub description_match: bool,
    pub keyword_matches: Vec<String>,
    pub snippet: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct SearchStats {
    pub total_posts: usize,
    pub indexed_words: usize,
    pub indexed_keywords: usize,
}

/// Sarch engine optimized for blog post search
#[wasm_bindgen]
pub struct SearchEngine {
    posts: Vec<PostData>,
    word_index: HashMap<String, Vec<(usize, f32)>>, // post_idx, weight
    keyword_index: HashMap<String, Vec<usize>>,
    normalized_cache: RefCell<HashMap<String, String>>,
}

#[wasm_bindgen]
impl SearchEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> SearchEngine {
        SearchEngine {
            posts: Vec::new(),
            word_index: HashMap::new(),
            keyword_index: HashMap::new(),
            normalized_cache: RefCell::new(HashMap::new()),
        }
    }

    /// Add a post to the search index
    #[wasm_bindgen]
    pub fn add_post(&mut self, post_data: &str) -> Result<(), JsValue> {
        let post: PostData = serde_wasm_bindgen::from_value(
            js_sys::JSON::parse(post_data).map_err(|_| JsValue::from_str("Invalid JSON"))?,
        )
        .map_err(|_| JsValue::from_str("Invalid post data"))?;

        let post_idx = self.posts.len();
        self.index_post(&post, post_idx);
        self.posts.push(post);
        Ok(())
    }

    /// Perform  search with SIMD-like optimizations
    #[wasm_bindgen]
    pub fn search(&self, query: &str, max_results: usize) -> String {
        if query.trim().is_empty() {
            return "[]".to_string();
        }

        let normalized_query = self.normalize_text(query);
        let query_terms: Vec<&str> = normalized_query.split_whitespace().collect();

        if query_terms.is_empty() {
            return "[]".to_string();
        }

        let mut results = self.execute_search(&query_terms);

        // Sort by relevance score (descending)
        results.sort_by(|a, b| {
            b.score
                .partial_cmp(&a.score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        // Limit results
        results.truncate(max_results);

        // Generate snippets for top results
        for result in &mut results {
            result.snippet = self.generate_snippet(&result.id, &query_terms);
        }

        serde_wasm_bindgen::to_value(&results)
            .map(|v| js_sys::JSON::stringify(&v).unwrap().as_string().unwrap())
            .unwrap_or_else(|_| "[]".to_string())
    }

    /// Search posts by tag with exact matching
    #[wasm_bindgen]
    pub fn search_by_tag(&self, tag: &str) -> String {
        let normalized_tag = self.normalize_text(tag);
        let mut results = Vec::new();

        if let Some(post_indices) = self.keyword_index.get(&normalized_tag) {
            for &post_idx in post_indices {
                if let Some(post) = self.posts.get(post_idx) {
                    results.push(SearchResult {
                        id: post.id.clone(),
                        score: 100.0,
                        title_match: false,
                        description_match: false,
                        keyword_matches: vec![tag.to_string()],
                        snippet: None,
                    });
                }
            }
        }

        serde_wasm_bindgen::to_value(&results)
            .map(|v| js_sys::JSON::stringify(&v).unwrap().as_string().unwrap())
            .unwrap_or_else(|_| "[]".to_string())
    }

    /// Get search engine statistics
    #[wasm_bindgen]
    pub fn get_stats(&self) -> String {
        let stats = SearchStats {
            total_posts: self.posts.len(),
            indexed_words: self.word_index.len(),
            indexed_keywords: self.keyword_index.len(),
        };

        serde_wasm_bindgen::to_value(&stats)
            .map(|v| js_sys::JSON::stringify(&v).unwrap().as_string().unwrap())
            .unwrap_or_else(|_| "{}".to_string())
    }

    /// Clear all indexed data
    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.posts.clear();
        self.word_index.clear();
        self.keyword_index.clear();
        self.normalized_cache.borrow_mut().clear();
    }
}

impl SearchEngine {
    /// Index a post with optimized scoring weights
    fn index_post(&mut self, post: &PostData, post_idx: usize) {
        // Index title words with high weight
        let title_words = self.tokenize(&post.title);
        for word in title_words {
            self.word_index
                .entry(word)
                .or_insert_with(Vec::new)
                .push((post_idx, 10.0)); // high weight for title
        }

        // Index description words with medium weight
        if let Some(description) = &post.description {
            let desc_words = self.tokenize(description);
            for word in desc_words {
                self.word_index
                    .entry(word)
                    .or_insert_with(Vec::new)
                    .push((post_idx, 5.0)); // medium weight for description
            }
        }

        // Index keywords with highest weight
        for keyword in &post.keywords {
            let normalized_keyword = self.normalize_text(keyword);
            self.keyword_index
                .entry(normalized_keyword.clone())
                .or_insert_with(Vec::new)
                .push(post_idx);

            // Also add keywords to word index with very high weight
            self.word_index
                .entry(normalized_keyword)
                .or_insert_with(Vec::new)
                .push((post_idx, 20.0)); // highest weight for keywords
        }
    }

    /// Execute search with optimized scoring
    fn execute_search(&self, query_terms: &[&str]) -> Vec<SearchResult> {
        let mut post_scores: HashMap<usize, f32> = HashMap::new();
        let mut post_matches: HashMap<usize, (bool, bool, Vec<String>)> = HashMap::new();

        // Score posts based on query terms
        for &term in query_terms {
            if let Some(entries) = self.word_index.get(term) {
                for &(post_idx, weight) in entries {
                    *post_scores.entry(post_idx).or_insert(0.0) += weight;

                    // Track match types
                    if let Some(post) = self.posts.get(post_idx) {
                        let entry =
                            post_matches
                                .entry(post_idx)
                                .or_insert((false, false, Vec::new()));

                        let norm_title = self.normalize_text(&post.title);
                        if norm_title.contains(term) {
                            entry.0 = true;
                        }

                        if let Some(description) = &post.description {
                            let norm_desc = self.normalize_text(description);
                            if norm_desc.contains(term) {
                                entry.1 = true;
                            }
                        }

                        // Check if term matches any keyword
                        for keyword in &post.keywords {
                            let norm_keyword = self.normalize_text(keyword);
                            if norm_keyword.contains(term) && !entry.2.contains(keyword) {
                                entry.2.push(keyword.clone());
                            }
                        }
                    }
                }
            }
        }

        // Apply phrase matching bonus for multi-term queries
        if query_terms.len() > 1 {
            let phrase = query_terms.join(" ");
            for (post_idx, score) in &mut post_scores {
                if let Some(post) = self.posts.get(*post_idx) {
                    let title_norm = self.normalize_text(&post.title);
                    if title_norm.contains(&phrase) {
                        *score += 50.0; // big bonus for exact phrase in title
                    }

                    if let Some(description) = &post.description {
                        let desc_norm = self.normalize_text(description);
                        if desc_norm.contains(&phrase) {
                            *score += 25.0; // bonus for exact phrase in description
                        }
                    }
                }
            }
        }

        // Convert to results
        let mut results = Vec::new();
        for (post_idx, score) in post_scores {
            if let Some(post) = self.posts.get(post_idx) {
                let default_matches = (false, false, Vec::new());
                let (title_match, desc_match, keyword_matches) =
                    post_matches.get(&post_idx).unwrap_or(&default_matches);

                results.push(SearchResult {
                    id: post.id.clone(),
                    score,
                    title_match: *title_match,
                    description_match: *desc_match,
                    keyword_matches: keyword_matches.clone(),
                    snippet: None,
                });
            }
        }

        results
    }

    /// Generate search snippet with highlighted terms
    fn generate_snippet(&self, post_id: &str, query_terms: &[&str]) -> Option<String> {
        let post = self.posts.iter().find(|p| p.id == post_id)?;

        // Prefer description for snippet, fallback to title
        let text = post.description.as_ref().unwrap_or(&post.title);
        let normalized = self.normalize_text(text);

        // Find best snippet position
        let mut best_pos = 0;
        let mut max_matches = 0;

        let snippet_len = 150;
        let words: Vec<&str> = normalized.split_whitespace().collect();

        for i in 0..words.len() {
            let end = (i + 20).min(words.len()); // check 20-word window
            let window = &words[i..end];
            let window_text = window.join(" ");

            let matches = query_terms
                .iter()
                .filter(|term| window_text.contains(*term))
                .count();

            if matches > max_matches {
                max_matches = matches;
                best_pos = i;
            }
        }

        // Generate snippet around best position
        let start = best_pos;
        let end = (start + 20).min(words.len());
        let snippet_words = &words[start..end];
        let mut snippet = snippet_words.join(" ");

        // Truncate to target length
        if snippet.len() > snippet_len {
            snippet.truncate(snippet_len);
            if let Some(last_space) = snippet.rfind(' ') {
                snippet.truncate(last_space);
            }
            snippet.push_str("...");
        }

        Some(snippet)
    }

    /// Normalize text for consistent searching
    fn normalize_text(&self, text: &str) -> String {
        // Check cache first
        if let Some(cached) = self.normalized_cache.borrow().get(text) {
            return cached.clone();
        }

        let normalized = text
            .to_lowercase()
            .chars()
            .filter(|c| c.is_alphanumeric() || c.is_whitespace() || *c == '-')
            .collect::<String>()
            .split_whitespace()
            .collect::<Vec<_>>()
            .join(" ");

        // Cache the result
        self.normalized_cache
            .borrow_mut()
            .insert(text.to_string(), normalized.clone());

        normalized
    }

    /// Tokenize text into searchable terms
    fn tokenize(&self, text: &str) -> Vec<String> {
        let normalized = self.normalize_text(text);
        normalized
            .split_whitespace()
            .filter(|word| word.len() >= 2) // filter very short words
            .map(|word| word.to_string())
            .collect()
    }
}

/// Text processing utilities
#[wasm_bindgen]
pub struct TextProcessor;

#[wasm_bindgen]
impl TextProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> TextProcessor {
        TextProcessor
    }

    /// Calculate reading time for blog posts
    #[wasm_bindgen]
    pub fn calculate_reading_time(&self, text: &str, words_per_minute: u32) -> u32 {
        let word_count = self.count_words(text);
        ((word_count as f32 / words_per_minute as f32).ceil() as u32).max(1)
    }

    /// Generate URL-friendly slug from text
    #[wasm_bindgen]
    pub fn generate_slug(&self, text: &str) -> String {
        text.to_lowercase()
            .chars()
            .map(|c| {
                if c.is_alphanumeric() {
                    c
                } else if c.is_whitespace() || c == '-' || c == '_' {
                    '-'
                } else {
                    '\0'
                }
            })
            .filter(|&c| c != '\0')
            .collect::<String>()
            .split('-')
            .filter(|s| !s.is_empty())
            .collect::<Vec<&str>>()
            .join("-")
    }

    /// Extract headings from markdown
    #[wasm_bindgen]
    pub fn extract_headings(&self, markdown: &str) -> String {
        let headings: Vec<&str> = markdown
            .lines()
            .filter_map(|line| {
                let trimmed = line.trim();
                if trimmed.starts_with('#') {
                    let level = trimmed.chars().take_while(|&c| c == '#').count();
                    if level > 0 && level <= 6 {
                        Some(trimmed[level..].trim())
                    } else {
                        None
                    }
                } else {
                    None
                }
            })
            .filter(|heading| !heading.is_empty())
            .collect();

        format!(
            "[{}]",
            headings
                .iter()
                .map(|h| format!("\"{}\"", h.replace("\"", "\\\"")))
                .collect::<Vec<_>>()
                .join(",")
        )
    }

    fn count_words(&self, text: &str) -> u32 {
        text.split_whitespace().count() as u32
    }
}
