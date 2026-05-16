# UI/UX Design Document: ProcureGuard

## 1. Introduction

This UI/UX Design Document outlines the user interface and user experience principles for **ProcureGuard**, an AI-powered supply chain risk intelligence platform that unifies procurement fraud detection and regulatory compliance. The design aims to provide a modern, intuitive, and efficient experience for procurement and compliance professionals, emphasizing clarity, accessibility, and actionable insights within a "21st dev component dark theme" aesthetic.

## 2. Design Principles

*   **Clarity & Simplicity:** Information should be presented clearly and concisely, avoiding clutter. Complex data visualizations, especially the unified knowledge graph, should be easy to interpret.
*   **Actionability:** The interface should guide users towards actionable insights, enabling quick decision-making to mitigate both financial and regulatory risks.
*   **Consistency:** Maintain a consistent visual language, interaction patterns, and terminology across the entire application.
*   **Efficiency:** Optimize workflows to minimize user effort and time spent on tasks, particularly for cross-domain queries.
*   **Responsiveness:** The interface should be fully responsive and adapt seamlessly across various devices and screen sizes.
*   **Dark Theme Focus:** Leverage a dark color palette to reduce eye strain, enhance focus on critical data and visualizations, and convey a sophisticated, modern aesthetic.

## 3. Target Audience

Procurement Managers, Supply Chain Analysts, Compliance Officers, and Business Executives who require quick access to critical supply chain risk intelligence, spanning both financial and regulatory domains.

## 4. Visual Design: 21st Dev Component Dark Theme

### 4.1. Color Palette

*   **Primary Background:** Deep charcoal or dark slate gray (`#1A1A1A` - `#2C2C2C`)
*   **Secondary Background/Cards:** Slightly lighter dark gray (`#333333` - `#444444`)
*   **Text:** Light gray or off-white for primary text (`#E0E0E0`), slightly darker gray for secondary text (`#A0A0A0`)
*   **Accent Colors:** Vibrant, yet subtle, colors to highlight key information, interactive elements, and data visualizations. Examples:
    *   **Blue/Cyan:** For primary actions, links, and positive indicators (`#00BFFF` - `#00FFFF`)
    *   **Orange/Amber:** For warnings, anomalies, or attention-grabbing elements (`#FFA500` - `#FFD700`)
    *   **Red:** For critical alerts, high-risk indicators, and regulatory violations (`#FF4500` - `#DC143C`)
    *   **Green:** For positive status, success messages, or low-risk indicators (`#32CD32` - `#00FF7F`)

### 4.2. Typography

*   **Font Family:** Modern, sans-serif fonts like `Inter`, `Roboto`, or `Open Sans` for readability and a clean aesthetic.
*   **Font Sizes:** A clear hierarchy of font sizes for headings, subheadings, body text, and captions.

### 4.3. Iconography

*   **Style:** Clean, minimalist, outline or filled icons that complement the dark theme.
*   **Libraries:** Utilize icon libraries like Font Awesome, Material Icons, or custom SVG icons.

### 4.4. Component Styling

*   **Buttons:** Subtle gradients or solid fills with clear hover states. Rounded corners for a softer, modern feel.
*   **Cards/Panels:** Elevated appearance using subtle shadows or borders against the dark background.
*   **Forms:** Clean input fields with clear focus states. Placeholder text in a lighter gray.
*   **Data Visualizations:** Charts and graphs should use the accent colors against the dark background for maximum impact and readability. Tooltips for detailed information on hover. Special emphasis on the knowledge graph visualization.

## 5. Key User Flows & Wireframe Concepts

### 5.1. Unified Dashboard Overview

*   **Layout:** A customizable dashboard featuring key performance indicators (KPIs) and a combined risk summary for both procurement and compliance.
*   **Components:**
    *   **Unified Risk Scorecard:** Overall supply chain risk score, factoring in both financial behavior and regulatory exposure, with drill-down capabilities.
    *   **Anomaly Feed:** Real-time alerts for detected anomalies (e.g., delivery delays, price spikes, unusual payment patterns, policy drift, transaction clusters).
    *   **High-Risk Vendor Overview:** Quick view of top high-risk vendors, highlighting reasons for their score (financial, regulatory, or both).
    *   **Knowledge Graph Snippet:** A small, interactive visualization showing critical dependencies and regulatory connections.

### 5.2. Natural Language Query Interface

*   **Layout:** A prominent search bar or chat-like interface, designed for complex, cross-domain queries.
*   **Components:**
    *   **Input Field:** For natural language questions, supporting queries like "which vendors have duplicate invoices AND operate in FCPA high-risk jurisdictions?".
    *   **Results Display:** Clear, concise answers powered by **Ollama qwen3.5:cloud**, featuring step-by-step reasoning ("Thinking mode") and support for analyzing scanned PDF images via vision capabilities. Results will include citations from both procurement and regulatory documents.
    *   **Follow-up Questions:** Suggestions for related and deeper-dive queries.

### 5.3. Vendor Profile View (Unified)

*   **Layout:** Detailed view of a single vendor, accessible from the dashboard or search results, presenting a holistic risk profile.
*   **Components:**
    *   **Summary:** Basic vendor information, unified risk rating, and compliance status.
    *   **Documents:** List of associated contracts, invoices, POs, and relevant regulatory filings, with quick access to content.
    *   **Unified Relationship Graph (The "Wow Moment"):** An interactive knowledge graph showing the vendor's direct and indirect dependencies, financial transactions, associated approvers, departments, applicable regulations, and known violations. This visualization will clearly demonstrate connections like: `vendor → invoice → approver → department → regulation → known policy gap`.
    *   **Historical Data:** Performance trends, anomaly history, and compliance records.

### 5.4. Data Ingestion & Validation Monitoring

*   **Layout:** A dedicated section for administrators or data engineers.
*   **Components:**
    *   **Pipeline Status:** Real-time status of unified data ingestion pipelines.
    *   **Validation Logs:** Detailed logs of data validation results, including errors and corrections for both procurement and compliance checks.
    *   **Configuration:** Settings for data sources and validation rules.

## 6. Interaction Design

*   **Navigation:** Intuitive sidebar navigation for main sections, with clear active states.
*   **Hover States:** Provide visual feedback on interactive elements.
*   **Loading Indicators:** Subtle animations for data loading and processing.
*   **Error Handling:** Clear and user-friendly error messages with guidance on how to resolve issues.

## 7. Accessibility Considerations

*   **Contrast Ratios:** Ensure sufficient contrast between text and background colors for readability.
*   **Keyboard Navigation:** All interactive elements should be navigable via keyboard.
*   **ARIA Labels:** Use appropriate ARIA attributes for screen reader compatibility.
