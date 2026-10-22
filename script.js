
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const taskList = document.getElementById("taskList");
const emptyMessage = document.getElementById("emptyMessage");

let tasks = [];
let currentFilter = "all";
let studyGoal = 2;

try {
  const savedTasks = JSON.parse(localStorage.getItem("focusflow-tasks"));
  if (Array.isArray(savedTasks)) {
    tasks = savedTasks.filter(task =>
      task &&
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.completed === "boolean" &&
      ["High", "Medium", "Low"].includes(task.priority)
    );
  }

  const savedGoal = Number(localStorage.getItem("focusflow-goal"));
  if (Number.isFinite(savedGoal) && savedGoal >= 1 && savedGoal <= 12) {
    studyGoal = savedGoal;
  }
} catch (error) {
  console.warn("Saved data could not be loaded.", error);
}

function saveTasks() {
  try {
    localStorage.setItem("focusflow-tasks", JSON.stringify(tasks));
    localStorage.setItem("focusflow-goal", String(studyGoal));
  } catch (error) {
    alert("Your browser could not save the data. Check your browser storage.");
  }
}

function updateDashboard() {
  const completed = tasks.filter(task => task.completed).length;
  const total = tasks.length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("totalTasks").textContent = total;
  document.getElementById("completedTasks").textContent = completed;
  document.getElementById("taskCount").textContent =
    `${total} ${total === 1 ? "task" : "tasks"}`;
  document.getElementById("progressPercent").textContent = `${percentage}%`;
  document.getElementById("progressBar").style.width = `${percentage}%`;
  document.getElementById("goalDisplay").textContent = studyGoal;

  const message = document.getElementById("progressMessage");

  if (total === 0) {
    message.textContent = "Let's get started. You've got this!";
  } else if (completed === total) {
    message.textContent = "Amazing! You've completed all your tasks!";
  } else {
    message.textContent = `${completed} of ${total} tasks completed. Keep going!`;
  }
}

function renderTasks() {
  taskList.replaceChildren();

  const filteredTasks = tasks.filter(task => {
    if (currentFilter === "pending") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  emptyMessage.style.display = filteredTasks.length === 0 ? "block" : "none";

  if (tasks.length > 0 && filteredTasks.length === 0) {
    emptyMessage.textContent = "Nothing here yet. Try another filter!";
  } else {
    emptyMessage.textContent = "Your list is clear. Add your first task above!";
  }

  filteredTasks.forEach(task => {
    const item = document.createElement("article");
    item.className = "task-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Complete ${task.title}`);

    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      saveTasks();
      renderTasks();
      updateDashboard();
    });

    const details = document.createElement("div");
    details.className = "task-details";

    const title = document.createElement("span");
    title.className = "task-title";
    if (task.completed) title.classList.add("done");
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const priority = document.createElement("span");
    priority.className = `priority ${task.priority}`;
    priority.textContent = task.priority;

    const state = document.createElement("span");
    state.className = "task-state";
    state.textContent = task.completed ? "Completed" : "Pending";

    meta.append(priority, state);
    details.append(title, meta);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "✕";
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);

    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter(existing => existing.id !== task.id);
      saveTasks();
      renderTasks();
      updateDashboard();
    });

    item.append(checkbox, details, deleteButton);
    taskList.appendChild(item);
  });
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = taskInput.value.trim();

  if (!title) {
    taskInput.focus();
    return;
  }

  tasks.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    priority: priorityInput.value,
    completed: false
  });

  saveTasks();
  renderTasks();
  updateDashboard();

  taskForm.reset();
  priorityInput.value = "Medium";
  taskInput.focus();
});

document.querySelectorAll(".filter-button").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    document.querySelectorAll(".filter-button").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    renderTasks();
  });
});

document.getElementById("editGoal").addEventListener("click", () => {
  const answer = prompt("Set your daily study goal (1–12 hours):", studyGoal);

  if (answer === null || answer.trim() === "") return;

  const newGoal = Number(answer);

  if (!Number.isInteger(newGoal) || newGoal < 1 || newGoal > 12) {
    alert("Please enter a whole number between 1 and 12.");
    return;
  }

  studyGoal = newGoal;
  saveTasks();
  updateDashboard();
});

// Focus timer
const timerDisplay = document.getElementById("timerDisplay");
const timerRing = document.querySelector(".timer-ring");
const timerMode = document.getElementById("timerMode");
const timerStatus = document.getElementById("timerStatus");
const startTimerButton = document.getElementById("startTimer");
const focusModeButton = document.getElementById("focusMode");
const breakModeButton = document.getElementById("breakMode");

let timerSeconds = 25 * 60;
let sessionLength = 25 * 60;
let timerInterval = null;
let endTime = null;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(timerSeconds);

  const progress = 1 - timerSeconds / sessionLength;
  const degrees = Math.round(progress * 360);

  timerRing.style.background =
    `conic-gradient(#7457e8 ${degrees}deg, #e9e4ff ${degrees}deg)`;
}

function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  endTime = null;
  startTimerButton.textContent = "▶ Start";
}

function tickTimer() {
  if (endTime === null) return;

  timerSeconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
  updateTimerDisplay();

  if (timerSeconds === 0) {
    stopTimer();
    timerStatus.textContent = "Session complete! 🎉";
    startTimerButton.textContent = "↻ Restart";
    alert("Great work! Your timer session is complete.");
  }
}

function selectSession(minutes) {
  stopTimer();

  sessionLength = minutes * 60;
  timerSeconds = sessionLength;

  const isFocus = minutes === 25;

  timerMode.textContent = isFocus ? "FOCUS SESSION" : "BREAK TIME";
  timerStatus.textContent = "Ready when you are";

  focusModeButton.classList.toggle("active", isFocus);
  breakModeButton.classList.toggle("active", !isFocus);

  updateTimerDisplay();
}

startTimerButton.addEventListener("click", () => {
  if (timerInterval !== null) {
    stopTimer();
    timerStatus.textContent = "Paused — take your time";
    return;
  }

  if (timerSeconds === 0) {
    timerSeconds = sessionLength;
  }

  endTime = Date.now() + timerSeconds * 1000;
  timerStatus.textContent = "You're doing great!";
  startTimerButton.textContent = "Ⅱ Pause";

  timerInterval = setInterval(tickTimer, 250);
});

document.getElementById("resetTimer").addEventListener("click", () => {
  stopTimer();
  timerSeconds = sessionLength;
  timerStatus.textContent = "Ready when you are";
  updateTimerDisplay();
});

focusModeButton.addEventListener("click", () => selectSession(25));
breakModeButton.addEventListener("click", () => selectSession(5));

// Display today's date
document.getElementById("todayDate").textContent =
  new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date());

// Initialize the dashboard
renderTasks();
updateDashboard();
updateTimerDisplay();
