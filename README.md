# MedCalc - Medical Calculators & Tools

A collection of evidence-based medical calculators and tools for healthcare professionals, designed to improve patient care and clinical decision-making.

## Project Overview

MedCalc provides reliable, peer-reviewed, and easy-to-use medical tools for clinical practice. The platform features various specialized calculators for healthcare professionals across different specialties.

## Tools Available

- **Syphilis Screening Tool**: Evaluate and manage congenital syphilis based on the latest AAP Red Book guidelines. Supports both conventional and reverse-sequence screening approaches.
- **More tools coming soon**

## Setup Instructions

This project is designed to be hosted on GitHub Pages or any static web server. No server-side processing is required.

1. Clone the repository
2. Open `index.html` in your browser to view the landing page
3. Navigate to specific tools in the `/tools` directory

## Project Structure
project-root/
│
├── index.html (landing page)
├── README.md
│
├── assets/
│   ├── css/
│   │   ├── styles.css (main styles)
│   │   ├── components.css (reusable components)
│   │   └── tools/ (tool-specific styles)
│   │
│   ├── js/
│   │   ├── main.js (shared functionality)
│   │   └── tools/ (tool-specific scripts)
│   │
│   ├── img/
│   │   ├── logo.svg
│   │   ├── icons/
│   │   └── tools/
│   │
│   └── data/
│       ├── syphilis-results.json
│       └── other-tool-data.json
│
├── tools/
│   ├── syphilis-screening.html
│   └── other-tools.html
│
└── pages/
├── about.html
├── contact.html
└── faq.html

## Technical Details

- Built with vanilla HTML, CSS, and JavaScript
- Responsive design that works on mobile devices and desktops
- No server-side dependencies required

## References

- Syphilis Screening Tool is based on guidelines from the American Academy of Pediatrics Red Book
- Source: http://publications.aap.org/redbook/book/chapter-pdf/1753196/rbo2024_s3_018_015_en.pdf

## License

For educational and clinical use only. Not for commercial use.

## Contact

For feedback or tool requests, please contact: feedback@medcalc-tools.com
