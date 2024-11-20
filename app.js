// DOM Elements
const taskForm = document.querySelector("#task-form");
const taskNameInput = document.querySelector("#task-name");
const taskDatetimeInput = document.querySelector("#task-date");
const listContainer = document.querySelector("#list-container");
const showTodayButton = document.querySelector("#show-today");
const showWeekButton = document.querySelector("#show-week");
const showMonthButton = document.querySelector("#show-month");
const showAllButton = document.querySelector("#show-all");

let tasks = [];

// Load tasks from localStorage
const storedTasks = localStorage.getItem("tasks");
if (storedTasks) {
  tasks = JSON.parse(storedTasks);
  renderList(tasks);
}

// Request Notification Permission
if (Notification.permission !== "granted") {
  Notification.requestPermission().then((permission) => {
    if (permission !== "granted") {
      alert("Notifications disabled. Enable them for task reminders.");
    }
  });
}

// Add new task
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(taskForm);
  const taskDate = new Date(formData.get("task-date"));
  const now = new Date();

  if (taskDate < now) {
    alert(
      "Cannot schedule a task in the past. Please select a future date and time."
    );
    return;
  }

  const newTask = {
    timeStamp: formData.get("task-date"),
    description: formData.get("task-name"),
    completed: false,
  };

  tasks.push(newTask);
  renderList(tasks);
  saveStateToLocalStorage();
  notifyTask([newTask]); // Notify only the new task
  taskForm.reset();
});

// Render tasks
function renderList(taskArr) {
  while (listContainer.firstChild) {
    listContainer.firstChild.remove();
  }

  taskArr.forEach((task, i) => {
    const taskContainer = document.createElement("div");
    taskContainer.classList.add("task-container");

    const timeStampElem = document.createElement("input");
    timeStampElem.classList.add("timestamp");
    timeStampElem.value = task.timeStamp;
    timeStampElem.readOnly = true;

    const descriptionElem = document.createElement("input");
    descriptionElem.classList.add("description");
    descriptionElem.value = task.description;
    descriptionElem.readOnly = true;

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.classList.add("edit-button");
    editButton.addEventListener("click", () => {
      const isEditing = !timeStampElem.readOnly;
      if (isEditing) {
        task.timeStamp = timeStampElem.value;
        task.description = descriptionElem.value;
        saveStateToLocalStorage();
      }

      timeStampElem.readOnly = !timeStampElem.readOnly;
      descriptionElem.readOnly = !descriptionElem.readOnly;
      editButton.textContent = isEditing ? "Edit" : "Save";
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete-button");
    deleteButton.addEventListener("click", () => {
      tasks.splice(i, 1);
      saveStateToLocalStorage();
      renderList(tasks);
    });

    taskContainer.append(
      timeStampElem,
      descriptionElem,
      editButton,
      deleteButton
    );
    listContainer.prepend(taskContainer);
  });
}

// Save tasks to localStorage
function saveStateToLocalStorage() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Schedule Notification
function scheduleNotification(task) {
  const notifyTime = new Date(task.timeStamp).getTime() - Date.now();

  if (notifyTime > 0) {
    setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification("Task Reminder", {
          body: `Task: ${task.description} is due now!`,
        });
      } else {
        alert(`Task Reminder: ${task.description} is due now!`);
      }
    }, notifyTime);
  } else {
    console.log(`Task "${task.description}" is already overdue!`);
  }
}

// Notify for all tasks
function notifyTask(tasks) {
  tasks.forEach((task) => {
    scheduleNotification(task);
  });
}
function filterTasksByPeriod(period) {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay()); // Start of week (Sunday)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let filteredTasks = [];

  if (period === "today") {
    filteredTasks = tasks.filter((task) => {
      const taskDate = new Date(task.timeStamp);
      return (
        taskDate >= startOfToday &&
        taskDate < new Date(startOfToday).setDate(startOfToday.getDate() + 1)
      );
    });
  } else if (period === "week") {
    filteredTasks = tasks.filter((task) => {
      const taskDate = new Date(task.timeStamp);
      return (
        taskDate >= startOfWeek &&
        taskDate < new Date(startOfWeek).setDate(startOfWeek.getDate() + 7)
      );
    });
  } else if (period === "month") {
    filteredTasks = tasks.filter((task) => {
      const taskDate = new Date(task.timeStamp);
      return (
        taskDate >= startOfMonth &&
        taskDate < new Date(now.getFullYear(), now.getMonth() + 1, 1)
      );
    });
  } else {
    filteredTasks = tasks; // Show all tasks
  }

  renderList(filteredTasks);
}
showTodayButton.addEventListener("click", () => filterTasksByPeriod("today"));
showWeekButton.addEventListener("click", () => filterTasksByPeriod("week"));
showMonthButton.addEventListener("click", () => filterTasksByPeriod("month"));
showAllButton.addEventListener("click", () => filterTasksByPeriod("all"));
