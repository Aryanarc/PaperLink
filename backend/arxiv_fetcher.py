import arxiv
import urllib.request
import os
import re

def parse_arxiv_id(url_or_id: str) -> str:
    """
    Accepts any of these formats and returns the clean arXiv ID:
      - https://arxiv.org/abs/2310.06825
      - https://arxiv.org/pdf/2310.06825
      - https://arxiv.org/abs/2310.06825v2
      - 2310.06825
      - 2310.06825v2
    """
    # strip trailing slash and whitespace
    url_or_id = url_or_id.strip().rstrip("/")

    # extract ID from URL if needed
    match = re.search(r'arxiv\.org(?:/abs|/pdf)?/([0-9]{4}\.[0-9]+(?:v\d+)?)', url_or_id)
    if match:
        return match.group(1)

    # already a bare ID like 2310.06825 or 2310.06825v2
    if re.match(r'^[0-9]{4}\.[0-9]+(v\d+)?$', url_or_id):
        return url_or_id

    raise ValueError(f"Could not parse arXiv ID from: {url_or_id}")


def fetch_arxiv_pdf(url_or_id: str, download_dir: str = "/tmp") -> dict:
    """
    Given an arXiv URL or ID:
      1. Fetches paper metadata (title, authors, abstract)
      2. Downloads the PDF to download_dir
      3. Returns { pdf_path, title, arxiv_id, authors, abstract }
    """
    arxiv_id = parse_arxiv_id(url_or_id)

    # search for the paper using the arxiv library
    search = arxiv.Search(id_list=[arxiv_id])
    results = list(search.results())

    if not results:
        raise ValueError(f"No paper found for arXiv ID: {arxiv_id}")

    paper = results[0]

    # build a safe filename from the title
    safe_title = re.sub(r'[^\w\s-]', '', paper.title)
    safe_title = re.sub(r'\s+', '_', safe_title.strip())[:80]  # limit length
    filename = f"{arxiv_id}_{safe_title}.pdf"
    pdf_path = os.path.join(download_dir, filename)

    # download the PDF
    paper.download_pdf(dirpath=download_dir, filename=filename)

    return {
        "pdf_path": pdf_path,
        "filename": filename,
        "title": paper.title,
        "arxiv_id": arxiv_id,
        "authors": [str(a) for a in paper.authors],
        "abstract": paper.summary,
    }