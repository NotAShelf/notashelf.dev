---
title: "Stop Scraping my Git Forge!"
date: 2025-01-07
description: "Just one of those that should be illegal, but is not."
keywords: ["rant", "linux", "web", "software"]
---

Not so long ago, while performing maintenance on my VPS and setting up
Prometheus, Grafana, and related tools, I noticed something unexpected yet not
entirely surprising. My Nginx instance was under constant bombardment of
requests from a specific subnet. Public-facing servers are no strangers to port
scans, but the intensity and specificity of these requests caught my attention
and prompted me to investigate further.

## Hello, Old Friend

I have parted ways with Facebook before its acquisition of Instagram. I hate
both of those platforms and the constant infringement of privacy they curse us
with. You understand my surprise when I looked at my Nginx webserver log and
found _thousands_ of requests coming my way; all with the user agent
`facebookexternalhit`. More specifically, they were sending `GET` requests to
_my personal Git forge_---a service where I store _personal_ projects that I
prefer not to entrust platforms such as Microsoft Github. Over **30,000** lines
were reserved to nothing but unsolicited `GET` requests in my access log. **What
the hell**?

Instinctively, I put together a quick Python script that follows the service
logs for Forgejo, which at the time also logged router events, and logs _unique_
IPs to a single file so that I can ban those IPs with firewall rules, using the
trusty nftables.

```python
import subprocess
import re
import time
from datetime import datetime

logfile = "unique_ips.log"
ipv4_pattern = re.compile(r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b")

def read_logged_ips():
    try:
        with open(logfile, "r") as file:
            return set(file.read().splitlines())
    except FileNotFoundError:
        return set()


def log_ip(ip, timestamp, logged_ips):
    with open(logfile, "a") as file:
        file.write(f"{timestamp} - {ip}\n")
    logged_ips.add(ip)


def main():
    logged_ips = read_logged_ips()
    process = subprocess.Popen(
        ["journalctl", "-xeu", "forgejo.service", "-f"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    while True:
        line = process.stdout.readline()
        if "404 Not Found" in line:
            ip_match = ipv4_pattern.search(line)
            if ip_match:
                ip = ip_match.group()
                if ip not in logged_ips:
                    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    log_ip(ip, timestamp, logged_ips)
                    print(f"Logged new IP: {ip} at {timestamp}")


if __name__ == "__main__":
    main()
```

I left the script, aptly and unimaginatively named `catch.py` running for around
an hour while I went to fix a nice meal for myself--- which you need to deal
with Meta's bullshit. When I came back, there were hundreds of _unique_ IPs in
the logfile. Not a handful, _hundreds_. Not only that, but they were coming from
several different subnets. This means

1. Meta is using several different providers (as evident from IP queries) to
   simply send bogus requests to people's webservers.
2. Meta is, in fact, _not_ respecting `robots.txt`.[^1]
3. They feel not at all inclined to maybe stop and think sending thousands of
   requests to people's servers _is malicious_.
4. To my demise, banning each and every single one of those subnets would take
   too long, and block possibly legitimate traffic.

## Get Out of My Lawn

```js
57.141.0.16 - - [22/Nov/2024:00:36:29 +0300] "GET /NotAShelf/nyx/commits/commit/4c82e5ee05fabd315a6e5c656fd72e11c93c4cfd/homes/notashelf/services/wayland/hyprpaper HTTP/2.0" 403 146 "-" "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)"
```

Here is an example of a request from my webserver logs. Take a look at the body.
They are scraping my _NixOS configuration_ that is available on my Git forge and
they are doing it **commit by commit**.

Following this unfortunate encounter, I have decided to start blocking any
requests coming with `meta-externalagent*` as their user agent. Such requests
now receive a 403 Forbidden response as per my adjusted Nginx configuration.

```nginx
# Define access and error log paths.
access_log /var/log/nginx/forgejo_access.log;
error_log /var/log/nginx/forgejo_error.log;

# Tell Facebook's crawlers to fuck right off.
if ($http_user_agent ~* "^meta-externalagent(/[\d\.]+)?$") {
  return 403;
}

if ($http_user_agent ~* "^facebookexternalhit(/[\d\.]+)?$") {
  return 403;
}
```

[forbidden from]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403

Okay, surely this will work. There is no way that a webcrawler is designed badly
or maliciously enough to disregard hundreds of error response 403s, indicating
that they are [forbidden from] accessing that URL. Surely?

Here is a request from today, shortly after I started writing this post.

```js
57.141.0.17 - - [07/Jan/2025:13:12:06 +0300] "GET /NotAShelf/nyx/raw/commit/93d16a3edbaa8177c76ed84c4c5b489649faa609/modules/common/options/default.nix HTTP/2.0" 403 146 "-" "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)"
```

At this point, I am not sure if this incompetence or plain stupidity.

## Ban Them All

This has been ~~yet another~~ a technical rant and a gentle nudge to you that
you should check _your_ webserver logs to see if your content is being scraped
for, well, as long as it has been online.

My Forgejo instance is now inaccessible to those who have not logged in---even
for public repositories--- and my Nginx configuration responds with 403 to any
requests coming from Meta's known crawlers. I have also tried sending an-email
to their webmaster as listed from the documentation URL attached to their
crawlers. It has now been 4 months since, but I am yet to receive a response, or
to see an indication of those crawlers stopping soon. Meanwhile, I am left to
deal with their recklessness on my own accord.

Instead, I will resort to banning ALL of them with nftables using IP ranges. It
is going to be annoying, but not fruitless, to write another Python script to
identify _each and every single subnet_ those requests are coming from. Once I
have a list, it will be trivial to draft the rule. I suggest that you do the
same.

Stay safe.

[very same documentation]: https://developers.facebook.com/docs/sharing/webmasters/web-crawlers

[^1]: Meta's own web-crawler documentation indicates that they may choose to
    disregard your `robots.txt` if they are performing "integrity or security
    checks" which in truth is just a vague way to say that you may sometimes
    decide to _not_ play by the rules. At this point your bet is banning them by
    IP range, which turns out to be listed in the [very same documentation] as
    the result of the command
    `whois -h whois.radb.net -- '-i origin AS32934' | grep ^route`. Naturally, I
    do not trust the information granted "graciously" by Meta, so I will be
    investigating my logfiles carefully to find if there is any more.
