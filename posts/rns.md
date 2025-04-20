---
title: "RNS: Native Neovim Configuration System"
description: |
  Beyond Lua: Building a Native Neovim Configuration System in Rust for fun and profit
date: 2025-05-18
keywords: ["neovim", "programming", "software", "rust"]
---

# Beyond Lua: Building a Native Neovim Configuration System

When most people think about configuring Neovim, they immediately think of Lua
scripts. Since (I believe) Neovim 0.5, Lua has become the dominant configuration
language, offering better performance and more flexibility than the older
VimScript. This is a good change, I think Lua makes a good configuration
language and it's performance is miles better than Vimscript. But what if we
could push the boundaries even further? What if we could configure Neovim using
native languages like C, Rust, or Zig? [^1]

[^1]: No programmers were hurt in the making of this project. Except for myself.

## Why Build a Native Configuration System?

To be honest with you, the _real_ reason I wanted to work on RNS because I
thought it was really funny. It _was_ really funny, and I ended up picking up a
few tricks about unsafe Rust along the way but let me think (and write)
counter-productively for a moment, and let's approach this from an _entirely_
technical perspective. I'll also be complaining about Lua a little bit, because
this is my blog and I get to do that.

### The Limitations of Lua

While Lua is fast and flexible, it's still an interpreted language with its own
limitations that bother me. **Type safety** is one. Lua is dynamically typed,
which can lead to runtime errors that would be caught at compile time in
languages like Rust. **Concurrency** is another "shortcoming", which has been
nagging me ever since I've started thinking about an async shell prompt that
uses Lua for module configurations. **Memory management** is last, though I
would say Lua's performance is still pretty decent. Garbage collection can cause
occasional stutters, but that is not actually a concern in the case for Neovim.

## Architecture: How RNS Works

RNS consists of several key components:

- FFI Layer: A bridge between Neovim's Lua API and our native code
- Core Library: Implements Neovim API abstractions in Rust
- Plugin Manager: Handles plugin installation and configuration
- Configuration API: Provides a clean interface for users to define their config

The system exposes functions like `nvim_set_option_bool()`,
`nvim_create_keymap()`, and `plugin_config_begin()` that can be called from C,
Rust, or Zig. Now, let's walk through each component, because I'm quite proud of
how ~~deranged~~ intricate the design is.

### The FFI Bridge

The trickiest part was designing the FFI layer. I needed to:

1. Safely convert between Rust strings and C strings
2. Handle memory management correctly across language boundaries
3. Translate Neovim's Lua API into C-compatible functions

Here is an example to draw you a clear picture of how I expose a Rust function
to C:

```rust
#[no_mangle]
pub extern "C" fn nvim_set_option_bool(name: *const c_char, value: c_int) -> c_int {
    match extract_c_string(name) {
        Ok(name_str) => {
            let cmd = if value != 0 {
                format!("set {}", name_str)
            } else {
                format!("set no{}", name_str)
            };
            
            match run_cmd(&cmd) {
                Ok(_) => 1,
                Err(_) => 0,
            }
        }
        Err(_) => 0,
    }
}
```

This function does a few critical things:

1. `#[no_mangle]` ensures the symbol name is preserved in the compiled output,
   making it accessible from C
2. `extern "C"` specifies the C calling convention
3. `*const c_char` is Rust's way of dealing with C strings (null-terminated
   character arrays)
4. The entire operation is wrapped in `match` expressions for safety, which is
   converting potential failures into _simple_ (and inefficient) integer returns

Under the hood, `extract_c_string` is converting an unsafe C string pointer into
a safe Rust `String`, and handling null pointers or invalid UTF-8:

```rust
pub(crate) fn extract_c_string(ptr: *const c_char) -> Result<String> {
    if ptr.is_null() {
        return Err(Error::NullPointer);
    }

    unsafe { Ok(CStr::from_ptr(ptr).to_string_lossy().into_owned()) }
}
```

The `unsafe` block is necessary because dereferencing raw pointers requires
unsafe code in Rust. The `to_string_lossy()` method handles invalid UTF-8
sequences by replacing them with the Unicode replacement character, preventing
crashes from malformed input.

What's fascinating here is that despite crossing language boundaries, we
maintain Rust's safety guarantees within our own code while providing a
C-compatible interface.

### Plugin Management

One of the most interesting features is the native plugin manager. I've designed
this because I still believe it profoundly funny that we can just... do this,
but the lack of a cleaner native API is still cumbersome. Design is funny at
best, and barely functional, but everyone has a plugin manager and now so do I.

```rust
#[no_mangle]
pub unsafe extern "C" fn install_plugins() -> c_int {
    let cmd = r"
        if not _G.plugins then return end
        local data_dir = vim.fn.stdpath('data')
        local plugin_dir = data_dir .. '/site/pack/managed/start/'

        if vim.fn.isdirectory(plugin_dir) == 0 then
            vim.fn.mkdir(plugin_dir, 'p')
        end

        for name, plugin in pairs(_G.plugins) do
            if plugin.enabled then
                local plugin_path = plugin_dir .. name
                if vim.fn.isdirectory(plugin_path) == 0 then
                    vim.notify('Installing ' .. name .. '...')
                    vim.fn.system({'git', 'clone', '--depth', '1', plugin.url, plugin_path})
                end
                plugin.path = plugin_path
                vim.opt.rtp:prepend(plugin_path)
            end
        end
        
        vim.cmd('packloadall')
    ";

    match crate::run_cmd(&format!("lua {cmd}")) {
        Ok(()) => 1,
        Err(_) => 0,
    }
}
```

This lets users register and install plugins with simple C function calls with a
basic schema that I could not be bothered to improve.

```c
register_plugin("telescope", "https://github.com/nvim-telescope/telescope.nvim");
install_plugins();
```

What's happening here is slightly ironic - we're using Rust to generate and
execute Lua code. Why? Because Neovim's API surface is primarily exposed through
Lua, and accessing the underlying C functions directly would require much more
complex FFI bindings.

The plugin system works by:

1. Maintaining a global Lua table `_G.plugins` to track registered plugins
2. Using Neovim's built-in functions for filesystem operations and Git commands
3. Updating the runtime path (`'rtp'`) to include newly installed plugins
4. Loading plugins through Neovim's standard `packloadall` mechanism

This approach leverages Neovim's package management infrastructure while
providing a native language interface. It's a hack, but I would say it is an
_elegant_ one - we get the benefits of both worlds without reinventing the
wheel.

The structured plugin configuration API was another interesting challenge:

```rust
#[no_mangle]
pub unsafe extern "C" fn plugin_config_begin(plugin_name: *const c_char) -> c_int {
    match extract_c_string(plugin_name) {
        Ok(name) => {
            CURRENT_PLUGIN = Some(name.clone());
            PLUGIN_CONFIG = Some(String::new());
            1
        }
        Err(_) => 0,
    }
}
```

This uses static mutable state (with `unsafe`) to build up configuration before
committing it - a pattern that feels more natural in C but requires care in
Rust. Since I come from a heavy C background, this is best of both worlds to me.

## Lessons Learned

### 1. FFI is Hard (But Worth It)

Foreign Function Interface (FFI) between languages is challenging. I've
encountered several issues while messing around with RNS. The critical issues
that I've had to work around were:

- String ownership and conversion between Rust and C
- Error handling across language boundaries
- Lifetime issues with Rust references passed to C

For example, I had to carefully manage memory when passing strings (the horror):

```rust
match extract_c_string(name) {
    Ok(name_str) => {
        // Use the string safely here
    }
    Err(_) => 0,
}
```

What makes FFI particularly challenging with Rust is that its ownership model
assumes complete control over memory. When interoperating with C, this
assumption breaks down, and we need to be explicit about **ownership
boundaries** (who's responsible for freeing the memory?) **lifetime guarantees**
(how long will pointers remain valid?) and **null safety** (how do we handle
null pointers that Rust's type system normally prevents?)

In practice, this means creating careful abstractions around the FFI boundary.
Every string coming from C needs validation before use, and every string passed
to C needs proper cleanup to avoid leaks.

One particularly subtle issue involves borrowing and lifetimes. Consider this
problematic pattern:

```rust
// WRONG: Creating a temporary that gets dropped
unsafe {
    let temp_string = String::from("example");
    let c_string = temp_string.as_ptr() as *const c_char;
    c_function(c_string); // Potentially using dangling pointer!
}
```

The correct approach is to ensure the string stays alive:

```rust
// RIGHT: CString outlives the call
unsafe {
    let c_string = CString::new("example").unwrap();
    c_function(c_string.as_ptr());
}
```

These subtleties make FFI code verbose but also incredibly explicit about data
ownership.

### 2. Neovim's (incredible) API Design

Working directly with Neovim's API taught me a lot about its architecture:

- The API is well-designed for language agnosticism
- Command execution is the universal interface
- The boundary between Vim commands and Lua API calls is sometimes blurry

Neovim's architecture is fascinating because it evolved from Vim's
command-oriented design to a modern, message-passing architecture. The editor
core is separate from the UI, communicating through a well-defined protocol,
which makes it ideal for embedding or extending.

The RPC API design means most operations can be performed either through direct
API calls or by executing commands as strings. For example, setting an option
can be done via:

```rust
// API approach
nvim_set_option_bool("number", 1);

// Command approach
run_cmd("set number");
```

This duality creates flexibility but also complexity when deciding the best
approach for each operation. In RNS, I generally favored the command approach
for simplicity, but a more robust implementation might use the API directly for
better type safety and error handling.

The most elegant part of Neovim's design is how it exposes a consistent
interface regardless of the client language. Whether you're using Lua, Python,
Rust, or JavaScript, the core concepts remain the same.

## Shortcomings and Challenges

### 1. Error Handling

Error handling across FFI boundaries is difficult. My current approach used
simple integer return codes (`0` for failure, `1` for success), but this loses
detailed error information:

```rust
match run_cmd(&cmd) {
    Ok(_) => 1,
    Err(_) => 0,  // We lose the specific error here
}
```

This is a classic problem in C interfaces - without exceptions or algebraic data
types, error details get flattened. A more robust approach might involve:

1. Setting error information in a thread-local or global variable
2. Providing an additional function to retrieve the last error message
3. Using a callback system for error handling

For example:

```rust
struct ErrorInfo {
    code: c_int,
    message: String,
}

thread_local! {
    static LAST_ERROR: RefCell<Option<ErrorInfo>> = RefCell::new(None);
}

fn set_error(code: c_int, message: &str) {
    LAST_ERROR.with(|cell| {
        *cell.borrow_mut() = Some(ErrorInfo {
            code,
            message: message.to_string(),
        });
    });
}

#[no_mangle]
pub extern "C" fn get_last_error_message() -> *const c_char {
    LAST_ERROR.with(|cell| {
        if let Some(ref error) = *cell.borrow() {
            let c_str = CString::new(error.message.clone()).unwrap_or_default();
            let ptr = c_str.as_ptr();
            std::mem::forget(c_str); // Leak the CString so the pointer remains valid
            ptr
        } else {
            std::ptr::null()
        }
    })
}
```

This pattern adds complexity but would allow for proper error diagnostics from
calling languages.

Ideally I'll be revisiting error handling once I feel more comfortable
propagating errors to Neovim.

### 2. Configuration Verbosity

```rust
// Rust version
nvim_set_option_bool(CString::new("number").unwrap().as_ptr(), 1);
```

```lua
-- Lua equivalent
vim.opt.number = true
```

The verbosity problem reflects a fundamental trade-off: the more type-safe and
explicit a language is, the more "ceremony" it requires. This verbosity could be
mitigated through better, hypothetical, abstractions:

```rust
// A hypothetical ergonomic wrapper
fn set_bool_option(name: &str, value: bool) {
    let c_name = CString::new(name).unwrap();
    unsafe { nvim_set_option_bool(c_name.as_ptr(), value as c_int) };
}

// Usage
set_bool_option("number", true);
```

Even better would be a builder pattern or fluent API:

```rust
// Hypothetical improved API
Config::new()
    .set_option("number", true)
    .set_option("relativenumber", true)
    .set_keymap("n", "<leader>w", ":w<CR>")
    .apply();
```

This is where Rust's trait system and zero-cost abstractions shine - we could
build a completely type-safe, ergonomic API on top of the raw FFI calls. The
possibilities are truly endless, and I can barely express how much of an itch
this is that I am _dying_ to scratch.

### 3. Recompilation Requirement

Unlike Lua configs that can be modified and sourced immediately, native
configurations require recompilation after changes. This massively speeds down
iteration, but for static configurations I think this is still feasible. At
least in theory, since I'm _yet_ to bench any performance metrics.

This limitation is inherent to compiled languages, but there are potential
mitigations:

1. **Split configuration**: Keep frequently-changed settings in Lua, with
   performance-critical parts in native code
2. **Dynamic loading**: Use a plugin architecture where compiled modules are
   loaded at runtime
3. **Hot reloading**: Implement a watcher that automatically recompiles and
   reloads when configs change

The compilation step also provides benefits - it catches typos and type errors
before Neovim even loads, preventing the infamous "fixing your editor while
trying to use it" problem.

From a technical perspective, the compilation process is actually quite simple.
We're building a shared library that Neovim's Lua interpreter loads via
`require()`. The Rust code compiles to a `.so` (Linux/macOS) or `.dll` (Windows)
file that exposes C-compatible functions:

```bash
cargo build --release
cp target/release/librns.so ~/.config/nvim/lua/rns.so
```

Then in Neovim:

```lua
-- Load the native module
local rns = require('rns')
-- Call functions on it
rns.set_options()
```

## Future Directions

RNS was a fun task, it really was. While I'm stopping for now I find there to be
many exciting possibilities. Namely, I'm looking forward to work on **JIT
compilation** to allow users to write configurations in a DSL that gets
JIT-compiled. It could also be pretty fun to integrate this said DSL with IDEs.

[inkwell]: https://github.com/TheDan64/inkwell

A JIT approach could leverage LLVM (which both Rust and Clang use) to generate
native code on the fly. This would combine the flexibility of interpreted
languages with the performance of native code.

The architecture might look like:

1. Parse the DSL into an intermediate representation
2. Apply optimizations and type checking
3. Generate LLVM IR
4. Use LLVM's JIT capabilities to compile to native code
5. Load and execute the result

This approach would be similar to how Julia works - dynamic feeling but with
native performance. Projects like [inkwell] provide Rust bindings to LLVM that
would make this feasible.

_Another_ interesting direction (because there aren't enough of those) would be
exposing Neovim's event loop directly to Rust async code, allowing for seamless
integration of asynchronous Rust with Neovim's concurrency model. Imagine being
able to write:

```rust
async fn fetch_git_status() -> String {
    // Asynchronously run git command
    let output = Command::new("git")
        .args(&["status", "--porcelain"])
        .output()
        .await?;
    
    String::from_utf8_lossy(&output.stdout).to_string()
}

// Register the async function with Neovim
register_statusline_component("git_status", fetch_git_status);
```

## Conclusion

Building RNS has been an educational journey into the depths of Neovim's
architecture and cross-language FFI. While a native configuration system might
not replace Lua for everyday users, it demonstrates what's _possible_ when we
push beyond conventional boundaries... such as sanity. If the API was cleaner, I
would argue that for certain use cases---especially performance-critical plugins
or environments where strong compile-time guarantees matter---a native approach
offers compelling advantages. As RNS also provides a foundation for more
ambitious extensions to Neovim's capabilities through native code. Though so far
RNS is just a toy experiment. I have much to learn about Neovim.

The most valuable lesson from this experiment has been understanding the
trade-offs between safety, performance, and developer experience. Rust's
ownership model provides incredible guarantees but requires careful design at
FFI boundaries. Neovim's architecture is elegant but occasionally opaque. And
while native code offers performance benefits, the development cycle is
undeniably slower. Perhaps the ideal approach is not to replace Lua entirely but
to use each language where it shines: Lua for rapid iteration and configuration,
Rust for performance-critical plugins, and a clean FFI layer to connect them
seamlessly. This hybrid approach could give users the best of all worlds - the
simplicity of Lua with the power of native code where it matters most. Or
perhaps, the real performance was the friends we made along the way.

That was all I had for you today. I hope this exploration has given you some
food for thought about the possibilities beyond Lua, and I'm looking forward to
hear any comments or critique that you might have. Cheers!
