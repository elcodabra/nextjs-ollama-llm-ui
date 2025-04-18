import type { NextRequest } from 'next/server'
import { chromium } from "playwright";
import robotsParser from "robots-parser";
import { writeFileSync } from "fs";
import path from "path";
import axios from "axios";
import { URL } from "url";

export const dynamic = 'force-dynamic'

async function getAllowedUrls(domain: string) {
  try {
    const robotsUrl = `${domain}/robots.txt`;
    const response = await axios.get(robotsUrl);
    const robots = robotsParser(robotsUrl, response.data);
    return robots.isAllowed("/") ? [domain] : [];
  } catch {
    return [domain];
  }
}

async function crawlDomain(domain: string, visited = new Set()) {
  if (visited.has(domain)) return [];
  visited.add(domain);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(domain, { waitUntil: "networkidle" });

  const text = await page.evaluate(() => document.body.innerText);
  console.log(`collected data from ${domain}:\n${text.substring(0, 200)}...`);
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a"))
      .map(a => a.href)
      .filter(href => href.startsWith(window.location.origin))
  );

  await browser.close();
  return [[domain, text], ...(await Promise.all(links.map(link => crawlDomain(link, visited))))];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get('domain');

  if (!domain) return Response.json({ status: 400, error: "a domain is required" });

  const allowedUrls = await getAllowedUrls(domain);
  // if (allowedUrls.length === 0) return Response.json({ status: 403, error: "denied by robots.txt" });

  const data = await crawlDomain(domain);
  const filePath = path.join(process.cwd(), "data", `${new URL(domain).hostname}.json`);
  writeFileSync(filePath, JSON.stringify(data, null, 2));

  return Response.json({
    status: 200,
    message: `success for domain: ${domain}`,
    pages: data.length,
  });
}
