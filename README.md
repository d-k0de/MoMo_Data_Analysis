# MoMo_Data_Analysis Readme
Backend data processing, database management, and frontend development.
===

## Information
- Title:  `MoMo SMS Data Analysis Dashboard`
- Authors:  `Divine Ifechukwude`,`Enoch Mugisha`,`Kelly Nshuti Dushimimana`, `Ulrich Rukazambuga` 
- Video: [Demo video](https://drive.google.com/file/d/1MH9qHUaUNnRb41DVrQJPUQeI--Pm1vIZ/view?usp=sharing)

## Install & Dependence
- Python 3.8+
- Flask
- sqlite3 (included with Python)
- lxml or xml.etree.ElementTree (for XML parsing)
- Chart.js (included via CDN in index.html)

## Dataset Preparation
| Dataset | Download |
| ---     | ---   |
| MTN MoMo SMS Data| [download](data/modified_sms_v2.xml) |


## Use
- To run the backend server (ensure it keeps running):
  ```
  python scripts/app.py 
  ```
- To process and populate the database with SMS data:
  ```
  python scripts/process_sms.py
  ```
  - To view the dashboard, open index.html in a browser after starting the server at http://127.0.0.1:5000

## Directory Hierarchy
```
|—— AUTHORS
|—— README.md
|—— Technical_Report_Momo_Analysis.pdf
|—— data
|    |—— modified_sms_v2.xml
|    |—— unprocessed.log
|—— database
|    |—— momo_data.db
|    |—— schema.sql
|—— index.html
|—— scripts
|    |—— app.py
|    |—— process_sms.py
|—— static
|    |—— script.js
|    |—— styles.css
|    |—— visualization.css
|    |—— visualization.js
```
## Code Details
### Tested Platform
- software
  ```
  OS: Windows 10 (June 2025), Ubuntu LTS
  Python: 3.13.0
  Flask: 2.3.2
  ```

## References
- [Python XML Parsing](https://docs.python.org/3/library/xml.etree.elementtree.html)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

## Technical Report

| Report | Download |
| ---     | ---   |
| Technical Report| [download](Technical_Report_Momo_Analysis.pdf) |