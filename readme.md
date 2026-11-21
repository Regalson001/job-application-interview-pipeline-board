A responsive Kanban-style job application tracker built with HTML, CSS, and vanilla JavaScript.

CareerFlow helps job seekers organize their applications, monitor interview progress, track follow-up dates, and manage opportunities from one dashboard.

## Features

- **Application Management:** Add, edit, and delete job applications.
- **Kanban Pipeline:** Organize applications into Applied, Interviewing, Offer, and Rejected stages.
- **Drag and Drop:** Move application cards between pipeline stages.
- **Search:** Find applications by company, role, location, or notes.
- **Filtering:** Filter applications by their current stage.
- **Sorting:** Sort by application date, company name, or follow-up date.
- **Follow-up Reminders:** Highlight overdue follow-ups and reminders due today.
- **Dashboard Statistics:** View total applications, interviews, offers, and follow-ups.
- **JSON Export:** Download a backup of your application data.
- **JSON Import:** Restore applications from a previous backup.
- **Persistent Storage:** Save data in browser localStorage.
- **Responsive Design:** Works across desktop, tablet, and mobile devices.

## Tech Stack

- HTML5
- CSS3
- JavaScript (ES6+)
- Browser localStorage
- JSON

## Project Structure

```text
job-application-interview-pipeline-board/
│
├── index.html
├── styles.css
├── app.js
└── README.md
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Regalson001/job-application-interview-pipeline-board.git
```

### 2. Open the project

```bash
cd job-application-interview-pipeline-board
```

### 3. Open in VS Code

```bash
code .
```

### 4. Run the application

Open `index.html` in your browser.

Alternatively, use the VS Code Live Server extension.

## How to Use

1. Click **Add application**.
2. Enter the company name and job title.
3. Add the job posting URL, application date, location, and notes.
4. Select the application stage.
5. Set a follow-up date if necessary.
6. Save your application.
7. Move applications between stages using drag and drop or the stage selector.
8. Use search and filters to find specific opportunities.
9. Export your data as JSON to create a backup.

## Data Storage

CareerFlow uses browser localStorage to persist application records.

No backend or database is required.

**Important:** Your application records are stored in the current browser on your device. Clearing browser data may remove them. Export regular JSON backups to protect your information.

## Future Improvements

- Interview calendar and scheduling.
- Email follow-up reminders.
- Salary and compensation tracking.
- Company contact management.
- Application analytics and conversion rates.
- Cloud synchronization and user authentication.
- AI-powered interview preparation.

## Author

**Stephen Oyugi**

GitHub: [@Regalson001](https://github.com/Regalson001)

## License

This project is licensed under the MIT License.
