import type { NextRequest } from 'next/server'
import { chromium } from "playwright";
import robotsParser from "robots-parser";
import { writeFileSync, existsSync, readFileSync } from "fs";
import path from "path";
import axios from "axios";
import { URL } from "url";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const dynamic = 'force-dynamic'

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000, chunkOverlap: 200
});

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

const appendToJSONFile = async (newData: any[] = [], filePath: string) => {
  let existingData = [];

  if (existsSync(filePath)) {
    const content = readFileSync(filePath, 'utf8');
    existingData = JSON.parse(content || '[]');
  }

  const combined = [...existingData, ...newData];
  console.log('writing...', JSON.stringify(combined))
  writeFileSync(filePath, JSON.stringify(combined, null, 2), 'utf8');
};

async function crawlDomain(domain: string, filePath: string, visited = new Set()) {
  if (visited.has(domain)) return [];
  visited.add(domain);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(domain, { waitUntil: "networkidle" });

  // Extract meaningful content: titles, headings, paragraphs
  const content = await page.evaluate(() => {
    const title = document.title;
    const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(el => el.innerText.trim());
    const paragraphs = Array.from(document.querySelectorAll('p')).map(el => el.innerText.trim());
    const links = Array.from(document.querySelectorAll('a')).map(el => ({
      text: el.innerText.trim(),
      href: el.href,
    }));

    return {
      title,
      headings,
      paragraphs,
      links
    };
  });

  // Structure it as a simple RAG document
  const ragDocument = {
    id: domain,
    metadata: {
      source: domain,
      title: content.title
    },
    pageContent: [content.headings.join('\n'), content.paragraphs.join('\n')].join('\n\n'),
  };

  const allSplits = await splitter.splitDocuments([ragDocument]);

  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a"))
      .map(a => a.href)
      .filter(href => href.startsWith(window.location.origin))
  );

  await browser.close();

  await appendToJSONFile(allSplits, filePath);

  return [[domain]];
  // return [[domain], ...(await Promise.all(links.map(link => crawlDomain(link, filePath, visited))))];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get('domain');

  if (!domain) return Response.json({ status: 400, error: "a domain is required" });

  const allowedUrls = await getAllowedUrls(domain);
  // if (allowedUrls.length === 0) return Response.json({ status: 403, error: "denied by robots.txt" });

  const filePath = path.join(process.cwd(), "data", `${new URL(domain).hostname}.json`);
  console.log('filePath = ', filePath);
  // Clear file content if exists
  writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8');
  const data = await crawlDomain(domain, filePath);

  return Response.json({
    status: 200,
    message: `starting for domain: ${domain}...`,
    pages: data.length,
  });
}
