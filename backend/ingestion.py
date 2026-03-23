import fitz # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter

def extract_text_from_pdf(pdf_path:str) -> list[dict]:
    doc=fitz.open(pdf_path)
    #we are opening a pdf and this return a list of pages 
    #each page is a dictionary with text and page number

    pages=[]
    for page_num in range(len(doc)):
        page=doc[page_num]
        text=page.get_text()

        #skip empty pages
        if text.strip():
            pages.append({
                "text":text,
                "page":page_num+1,
                
        
                    })
    return pages


def chunk_pages(pages: list[dict],source_filename:str) ->list[dict]:
    splitter=RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=64,
        separators=[
            "\n\n",
            "\n",
            "."," "
                    ]
    )

    all_chunks=[]

    for page in pages:
        splits = splitter.split_text(page["text"])


        for i,chunk_text in enumerate(splits):
            all_chunks.append({
                "text":chunk_text,
                "metadata":{
                    "source":source_filename,
                    "page":page["page"],
                    "chunk_index":i
                }
                            })

    return all_chunks