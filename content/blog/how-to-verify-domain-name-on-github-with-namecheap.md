---
title: "How to Verify a Domain Name on GitHub with Namecheap"
date: 2020-01-27T17:10:36-06:00
description: "Let's take a closer look at DNS records and verify a domain on GitHub"
author: Jacob Lindahl
twitter: sudo_build
license:
  name: CC BY-SA 4.0
  link: https://creativecommons.org/licenses/by-sa/4.0/
---

Wouldn't it be awesome to see that little "Verified" badge next to your GitHub organization's name? (See what I'm talking about [here](https://github.com/GeekLaunch).)

If you're new to domain name wrangling and DNS might as well stand for [Desoxyribonukleinsäure](https://de.wikipedia.org/wiki/Desoxyribonukleins%C3%A4ure), this is a perfect place to start.

Make sure you have these things before we get started:

- An organization on GitHub
- A domain name you'd like to associate with that organization

You must have access to the DNS records for the domain name. In this post, we'll be going through the steps with the domain registrar [Namecheap](https://www.namecheap.com/).

## Step 1: Adding the domain to GitHub

Navigate to your organization's page on GitHub, then click on the "Settings" tab, then the "Verified domains" category on the sidebar. We should arrive at a page something like this:

![GitHub view verified domains](./01-github-view-verified-domains.png)

Enter your domain name in the text box:

![Adding a domain name to GitHub](./02-github-add-a-domain.png)

Next, we'll get a screen that looks something like this:

![Verify domain screen with DNS information](./03-github-verify-domain-dns-txt.png)

GitHub tells us to add a TXT record to the DNS configuration of our domain name. Don't worry, this is just like adding a bit of public metadata to your domain. It won't break anything.

So, how do we add this TXT record to our domain name? That's where Namecheap comes in.

## Step 2: Modifying the DNS records

Log in to your domain name registrar and find the domain that you want to verify on GitHub. You're looking for a section that allows you to modify DNS records. It might be called something like "Advanced DNS," "Resource Records," or "Manage DNS."

![Adding a new DNS record in Namecheap](./04-namecheap-add-new-dns-record.png)

GitHub gave us two pieces of information that we need to add to our DNS configuration. One is the name (or host) for the TXT record. It looks something like this: <code>\_github-challenge-_&lt;organization>_._&lt;domain>_._&lt;tld>_.</code>. The second part is a code for us to put in the value field of the TXT record.

Notice that the name for the TXT record _already contains_ our domain name at the end (and followed by another `.` to make it a [fully qualified domain name](https://en.wikipedia.org/wiki/Fully_qualified_domain_name)), so we don't need to paste the whole thing into the host field. Instead, just use the <code>\_github-challenge-_&lt;organization>_.</code> part.

![The new TXT records entered into the Namecheap administration console](./05-namecheap-txt-record-save.png)

This change can take some time to propagate, but often you will see the records update in a matter of minutes, depending on which DNS servers you're using.

If you're using a Linux operating system or if you have WSL installed on Windows, you can check the status of the DNS records using this command: <code>dig \_github-challenge-_&lt;organization>_._&lt;domain>_._&lt;tld>_ TXT</code>. This will grab all of the TXT records for that host.

![Running the dig command](./06-dig-dns-txt-record.png)

Once we've made sure that the DNS records have been updated, we can go back over to GitHub.

## Step 3: Verifying the domain on GitHub

This is the easy part! Go back to the page on GitHub and click the "Verify domain" button.

![Clicking the "Verify domain" button back on GitHub](./07-github-verify-domain.png)

You should be greeted with the following success screen:

![Successfully verified domain on GitHub](./08-github-domain-verified.png)

Congratulations! Your organization's domain is now verified on GitHub.
