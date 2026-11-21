
"use strict";

/* =========================================
   CAREERFLOW - JOB APPLICATION PIPELINE
========================================= */

const STORAGE_KEY = "careerflow_applications_v1";

const STAGES = ["Applied", "Interviewing", "Offer", "Rejected"];

let applications = loadApplications();
let draggedJobId = null;
let toastTimeout = null;
let showFollowupsOnly = false;

const elements = {
  totalStat: document.getElementById("totalStat"),
  interviewStat: document.getElementById("interviewStat"),
  offerStat: document.getElementById("offerStat"),
  followupStat: document.getElementById("followupStat"),
  followupCount: document.getElementById("followupCount"),

  searchInput: document.getElementById("searchInput"),
  stageFilter: document.getElementById("stageFilter"),
  sortFilter: document.getElementById("sortFilter"),

  modal: document.getElementById("jobModal"),
  modalTitle: document.getElementById("modalTitle"),
  form: document.getElementById("jobForm"),
  jobId: document.getElementById("jobId"),
  company: document.getElementById("company"),
  role: document.getElementById("role"),
  jobLink: document.getElementById("jobLink"),
  appliedDate: document.getElementById("appliedDate"),
  stage: document.getElementById("stage"),
  followupDate: document.getElementById("followupDate"),
  location: document.getElementById("location"),
  notes: document.getElementById("notes"),

  toast: document.getElementById("toast"),
  importFile: document.getElementById("importFile")
};

/* =========================================
   STORAGE
========================================= */

function loadApplications() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidApplication);
  } catch (error) {
    console.error("Could not load saved applications:", error);
    return [];
  }
}

function saveApplications() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  } catch (error) {
    console.error("Could not save applications:", error);
    showToast("Unable to save data. Browser storage may be full.");
  }
}

function isValidApplication(job) {
  return (
    job &&
    typeof job === "object" &&
    typeof job.company === "string" &&
    typeof job.role === "string" &&
    typeof job.id === "string" &&
    STAGES.includes(job.stage)
  );
}

/* =========================================
   UTILITIES
========================================= */

function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "job-" + Date.now() + "-" +
    Math.random().toString(36).slice(2, 10);
}

function todayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return "Not set";

  const date = new Date(dateString + "T00:00:00");

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function getFollowupStatus(dateString) {
  if (!dateString) return null;

  const today = todayString();

  if (dateString < today) return "overdue";
  if (dateString === today) return "due";

  return "upcoming";
}

function getFollowupLabel(dateString) {
  const status = getFollowupStatus(dateString);

  if (status === "overdue") return "Overdue follow-up";
  if (status === "due") return "Follow-up today";

  return "Follow-up: " + formatDate(dateString);
}

function isFollowupDue(job) {
  return (
    job.followupDate &&
    job.followupDate <= todayString() &&
    job.stage !== "Rejected" &&
    job.stage !== "Offer"
  );
}

function safeExternalUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.href;
    }

    return null;
  } catch {
    return null;
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2800);
}

/* =========================================
   MODAL
========================================= */

function openModal(job = null, defaultStage = "Applied") {
  elements.form.reset();
  elements.jobId.value = "";

  if (job) {
    elements.modalTitle.textContent = "Edit application";

    elements.jobId.value = job.id;
    elements.company.value = job.company;
    elements.role.value = job.role;
    elements.jobLink.value = job.jobLink || "";
    elements.appliedDate.value = job.appliedDate;
    elements.stage.value = job.stage;
    elements.followupDate.value = job.followupDate || "";
    elements.location.value = job.location || "";
    elements.notes.value = job.notes || "";
  } else {
    elements.modalTitle.textContent = "Add application";
    elements.appliedDate.value = todayString();
    elements.stage.value = STAGES.includes(defaultStage)
      ? defaultStage
      : "Applied";
  }

  elements.modal.classList.add("open");
  elements.modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  setTimeout(() => elements.company.focus(), 50);
}

function closeModal() {
  elements.modal.classList.remove("open");
  elements.modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.getElementById("addJobBtn").addEventListener("click", () => {
  openModal();
});

document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);

elements.modal.addEventListener("click", (event) => {
  if (event.target === elements.modal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.modal.classList.contains("open")) {
    closeModal();
  }
});

/* =========================================
   ADD AND EDIT APPLICATIONS
========================================= */

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();

  const company = elements.company.value.trim();
  const role = elements.role.value.trim();
  const appliedDate = elements.appliedDate.value;
  const stage = elements.stage.value;

  if (!company || !role || !appliedDate || !STAGES.includes(stage)) {
    showToast("Please complete all required fields.");
    return;
  }

  const jobLink = elements.jobLink.value.trim();

  if (jobLink && !safeExternalUrl(jobLink)) {
    showToast("Please enter a valid HTTP or HTTPS job URL.");
    elements.jobLink.focus();
    return;
  }

  const id = elements.jobId.value;

  const jobData = {
    company,
    role,
    jobLink,
    appliedDate,
    stage,
    followupDate: elements.followupDate.value,
    location: elements.location.value.trim(),
    notes: elements.notes.value.trim()
  };

  if (id) {
    const index = applications.findIndex(job => job.id === id);

    if (index === -1) {
      showToast("Application could not be found.");
      return;
    }

    applications[index] = {
      ...applications[index],
      ...jobData,
      updatedAt: new Date().toISOString()
    };

    showToast("Application updated successfully.");
  } else {
    applications.push({
      id: createId(),
      ...jobData,
      createdAt: new Date().toISOString()
    });

    showToast("Application added successfully.");
  }

  saveApplications();
  renderBoard();
  closeModal();
});

/* =========================================
   DELETE APPLICATION
========================================= */

function deleteApplication(id) {
  const job = applications.find(item => item.id === id);

  if (!job) return;

  const confirmed = confirm(
    `Delete the application for ${job.role} at ${job.company}?`
  );

  if (!confirmed) return;

  applications = applications.filter(item => item.id !== id);

  saveApplications();
  renderBoard();
  showToast("Application deleted.");
}

/* =========================================
   CHANGE APPLICATION STAGE
========================================= */

function updateStage(id, newStage) {
  if (!STAGES.includes(newStage)) return;

  const job = applications.find(item => item.id === id);

  if (!job) return;

  job.stage = newStage;
  job.updatedAt = new Date().toISOString();

  saveApplications();
  renderBoard();

  showToast(`Moved to ${newStage}.`);
}

/* =========================================
   SEARCH, FILTER AND SORT
========================================= */

function getVisibleApplications() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const selectedStage = elements.stageFilter.value;
  const sort = elements.sortFilter.value;

  let visible = applications.filter(job => {
    const matchesSearch =
      job.company.toLowerCase().includes(query) ||
      job.role.toLowerCase().includes(query) ||
      (job.location || "").toLowerCase().includes(query) ||
      (job.notes || "").toLowerCase().includes(query);

    const matchesStage =
      selectedStage === "all" || job.stage === selectedStage;

    const matchesFollowups =
      !showFollowupsOnly || isFollowupDue(job);

    return matchesSearch && matchesStage && matchesFollowups;
  });

  visible.sort((a, b) => {
    if (sort === "oldest") {
      return a.appliedDate.localeCompare(b.appliedDate);
    }

    if (sort === "company") {
      return a.company.localeCompare(b.company);
    }

    if (sort === "followup") {
      const aDate = a.followupDate || "9999-12-31";
      const bDate = b.followupDate || "9999-12-31";

      return aDate.localeCompare(bDate);
    }

    return b.appliedDate.localeCompare(a.appliedDate);
  });

  return visible;
}

elements.searchInput.addEventListener("input", renderBoard);
elements.stageFilter.addEventListener("change", renderBoard);
elements.sortFilter.addEventListener("change", renderBoard);

/* =========================================
   BUILD APPLICATION CARD
========================================= */

function createJobCard(job) {
  const card = document.createElement("article");
  card.className = "job-card";
  card.draggable = true;
  card.dataset.id = job.id;

  const top = document.createElement("div");
  top.className = "card-top";

  const mark = document.createElement("div");
  mark.className = "company-mark";
  mark.textContent = job.company.charAt(0).toUpperCase();

  const menu = document.createElement("div");
  menu.className = "card-menu";

  const editButton = document.createElement("button");
  editButton.className = "icon-btn";
  editButton.type = "button";
  editButton.textContent = "✎";
  editButton.title = "Edit application";
  editButton.setAttribute("aria-label", "Edit " + job.company);

  editButton.addEventListener("click", () => openModal(job));

  const deleteButton = document.createElement("button");
  deleteButton.className = "icon-btn";
  deleteButton.type = "button";
  deleteButton.textContent = "×";
  deleteButton.title = "Delete application";
  deleteButton.setAttribute("aria-label", "Delete " + job.company);

  deleteButton.addEventListener("click", () => deleteApplication(job.id));

  menu.append(editButton, deleteButton);
  top.append(mark, menu);

  const title = document.createElement("h4");
  title.textContent = job.role;

  const company = document.createElement("p");
  company.className = "company-name";
  company.textContent = job.company;

  card.append(top, title, company);

  if (job.location) {
    const location = document.createElement("p");
    location.className = "card-location";
    location.textContent = "⌖ " + job.location;
    card.append(location);
  }

  const dateRow = document.createElement("div");
  dateRow.className = "card-date-row";

  const dateLabel = document.createElement("span");
  dateLabel.textContent = "Applied";

  const dateValue = document.createElement("span");
  dateValue.textContent = formatDate(job.appliedDate);

  dateRow.append(dateLabel, dateValue);
  card.append(dateRow);

  if (job.jobLink) {
    const safeUrl = safeExternalUrl(job.jobLink);

    if (safeUrl) {
      const link = document.createElement("a");
      link.href = safeUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "View job posting ↗";
      link.className = "card-notes";
      card.append(link);
    }
  }

  if (job.notes) {
    const notes = document.createElement("p");
    notes.className = "card-notes";
    notes.textContent = job.notes.length > 115
      ? job.notes.slice(0, 115) + "..."
      : job.notes;

    card.append(notes);
  }

  if (job.followupDate) {
    const status = getFollowupStatus(job.followupDate);

    const followup = document.createElement("div");
    followup.className = "followup-tag";

    if (status === "due") followup.classList.add("due");
    if (status === "overdue") followup.classList.add("overdue");

    followup.textContent = "◷ " + getFollowupLabel(job.followupDate);
    card.append(followup);
  }

  const stageControl = document.createElement("div");
  stageControl.className = "card-stage-control";

  const stageLabel = document.createElement("label");
  stageLabel.textContent = "Move to";

  const stageSelect = document.createElement("select");
  stageSelect.setAttribute("aria-label", "Change stage for " + job.role);

  STAGES.forEach(stage => {
    const option = document.createElement("option");
    option.value = stage;
    option.textContent = stage;
    option.selected = stage === job.stage;
    stageSelect.append(option);
  });

  stageSelect.addEventListener("change", () => {
    updateStage(job.id, stageSelect.value);
  });

  stageControl.append(stageLabel, stageSelect);
  card.append(stageControl);

  card.addEventListener("dragstart", (event) => {
    draggedJobId = job.id;
    card.classList.add("dragging");

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", job.id);
  });

  card.addEventListener("dragend", () => {
    draggedJobId = null;
    card.classList.remove("dragging");

    document.querySelectorAll(".kanban-column").forEach(column => {
      column.classList.remove("drag-over");
    });
  });

  return card;
}

/* =========================================
   RENDER BOARD
========================================= */

function renderBoard() {
  const visible = getVisibleApplications();

  STAGES.forEach(stage => {
    const key = stage.replace(" ", "");
    const list = document.getElementById("list" + key);

    list.replaceChildren();

    const stageJobs = visible.filter(job => job.stage === stage);

    document.getElementById("count" + key).textContent = stageJobs.length;

    if (stageJobs.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = showFollowupsOnly
        ? "No follow-ups due in this stage."
        : "No applications here yet.";

      list.append(empty);
    } else {
      stageJobs.forEach(job => {
        list.append(createJobCard(job));
      });
    }
  });

  updateStats();
}

/* =========================================
   DASHBOARD STATISTICS
========================================= */

function updateStats() {
  const total = applications.length;

  const interviews = applications.filter(
    job => job.stage === "Interviewing"
  ).length;

  const offers = applications.filter(
    job => job.stage === "Offer"
  ).length;

  const followups = applications.filter(isFollowupDue).length;

  elements.totalStat.textContent = total;
  elements.interviewStat.textContent = interviews;
  elements.offerStat.textContent = offers;
  elements.followupStat.textContent = followups;
  elements.followupCount.textContent = followups;
}

/* =========================================
   DRAG AND DROP
========================================= */

document.querySelectorAll(".kanban-column").forEach(column => {
  column.addEventListener("dragover", event => {
    event.preventDefault();
    column.classList.add("drag-over");
  });

  column.addEventListener("dragleave", event => {
    if (!column.contains(event.relatedTarget)) {
      column.classList.remove("drag-over");
    }
  });

  column.addEventListener("drop", event => {
    event.preventDefault();
    column.classList.remove("drag-over");

    const jobId =
      event.dataTransfer.getData("text/plain") || draggedJobId;

    const newStage = column.dataset.stage;

    if (jobId && STAGES.includes(newStage)) {
      updateStage(jobId, newStage);
    }
  });
});

/* =========================================
   ADD APPLICATION FROM COLUMN
========================================= */

document.querySelectorAll("[data-add-stage]").forEach(button => {
  button.addEventListener("click", () => {
    openModal(null, button.dataset.addStage);
  });
});

/* =========================================
   FOLLOW-UP VIEW
========================================= */

document.getElementById("followupNav").addEventListener("click", event => {
  event.preventDefault();

  showFollowupsOnly = !showFollowupsOnly;

  elements.searchInput.value = "";
  elements.stageFilter.value = "all";

  document.getElementById("followupNav").classList.toggle(
    "active",
    showFollowupsOnly
  );

  renderBoard();

  showToast(
    showFollowupsOnly
      ? "Showing applications requiring follow-up."
      : "Showing all applications."
  );
});

/* =========================================
   EXPORT JSON BACKUP
========================================= */

function exportApplications() {
  const backup = {
    app: "CareerFlow Job Pipeline Board",
    version: 1,
    exportedAt: new Date().toISOString(),
    applications
  };

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `careerflow-backup-${todayString()}.json`;

  document.body.append(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  showToast("JSON backup exported successfully.");
}

document.getElementById("exportBtn").addEventListener(
  "click",
  exportApplications
);

/* =========================================
   IMPORT JSON BACKUP
========================================= */

document.getElementById("importBtn").addEventListener("click", () => {
  elements.importFile.click();
});

elements.importFile.addEventListener("change", async event => {
  const file = event.target.files[0];

  if (!file) return;

  try {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("The backup file must be smaller than 5 MB.");
    }

    const content = await file.text();
    const parsed = JSON.parse(content);

    const imported = Array.isArray(parsed)
      ? parsed
      : parsed.applications;

    if (!Array.isArray(imported)) {
      throw new Error("This file does not contain a valid applications list.");
    }

    const validJobs = imported.filter(job => {
      return (
        job &&
        typeof job === "object" &&
        typeof job.company === "string" &&
        job.company.trim() &&
        typeof job.role === "string" &&
        job.role.trim() &&
        typeof job.appliedDate === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(job.appliedDate) &&
        STAGES.includes(job.stage)
      );
    });

    if (validJobs.length !== imported.length) {
      throw new Error("The backup contains invalid application records.");
    }

    const confirmed = confirm(
      `Import ${validJobs.length} applications? This will replace your current board.`
    );

    if (!confirmed) return;

    applications = validJobs.map(job => ({
      id: createId(),
      company: job.company.trim(),
      role: job.role.trim(),
      jobLink: typeof job.jobLink === "string" ? job.jobLink : "",
      appliedDate: job.appliedDate,
      stage: job.stage,
      followupDate: typeof job.followupDate === "string"
        ? job.followupDate
        : "",
      location: typeof job.location === "string" ? job.location : "",
      notes: typeof job.notes === "string" ? job.notes : "",
      createdAt: job.createdAt || new Date().toISOString()
    }));

    saveApplications();
    renderBoard();

    showToast(`${applications.length} applications imported.`);
  } catch (error) {
    showToast(error.message || "Unable to import this backup.");
  } finally {
    elements.importFile.value = "";
  }
});

/* =========================================
   INITIALIZE APPLICATION
========================================= */

document.getElementById("currentYear").textContent =
  new Date().getFullYear();

renderBoard();
