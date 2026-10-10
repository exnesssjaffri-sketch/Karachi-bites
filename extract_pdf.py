import sys
sys.path.insert(0, 'C:/Users/ALI HAIDER/AppData/Local/Packages/PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0/LocalCache/local-packages/Python313/site-packages')
from pypdf import PdfReader
r = PdfReader('c:/Users/ALI HAIDER/Downloads/Karachi_Bites_Student_Brief.pdf')
print(f'Total pages: {len(r.pages)}')
for i, p in enumerate(r.pages):
    print(f'\n===== PAGE {i+1} =====')
    print(p.extract_text())