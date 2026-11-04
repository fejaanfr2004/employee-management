// Backend API URL
const API_URL = "http://localhost:5000/api/employees";

// Current filter
let currentFilter = "all";

// Store employees
let employees = [];

// HTML elements
const employeeTable = document.getElementById("employeeTable");
const totalCount = document.getElementById("totalCount");
const activeCount = document.getElementById("activeCount");
const deletedCount = document.getElementById("deletedCount");

const employeeModal = document.getElementById("employeeModal");
const employeeForm = document.getElementById("employeeForm");
const searchInput = document.getElementById("searchInput");
const message = document.getElementById("message");


// Escape data before inserting it into HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}


// Show message
function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#dc2626" : "#15803d";

    setTimeout(() => {
        message.textContent = "";
    }, 3000);
}


// GET: Fetch all employees
async function fetchEmployees() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to fetch employees");
        }

        employees = await response.json();

        updateDashboard();
        displayEmployees();

    } catch (error) {
        console.error(error);

        employeeTable.innerHTML = `
            <tr>
                <td colspan="7">Unable to load employees. Check your backend.</td>
            </tr>
        `;

        showMessage(error.message, true);
    }
}


// Update dashboard statistics
function updateDashboard() {
    const active = employees.filter(emp => emp.deleted == null);
    const deleted = employees.filter(emp => emp.deleted != null);

    totalCount.textContent = employees.length;
    activeCount.textContent = active.length;
    deletedCount.textContent = deleted.length;
}


// Display employees
function displayEmployees() {

    let filteredEmployees = employees;

    if (currentFilter === "active") {
        filteredEmployees = employees.filter(
            emp => emp.deleted == null
        );
    }

    if (currentFilter === "deleted") {
        filteredEmployees = employees.filter(
            emp => emp.deleted != null
        );
    }

    // Search functionality
    const searchValue = searchInput.value.toLowerCase();

    filteredEmployees = filteredEmployees.filter(emp => {
        return (
            String(emp.name ?? "").toLowerCase().includes(searchValue) ||
            String(emp.email ?? "").toLowerCase().includes(searchValue) ||
            String(emp.city ?? "").toLowerCase().includes(searchValue)
        );
    });

    if (filteredEmployees.length === 0) {
        employeeTable.innerHTML = `
            <tr>
                <td colspan="7">No employees found.</td>
            </tr>
        `;
        return;
    }

    employeeTable.innerHTML = filteredEmployees.map(emp => {

        const isDeleted = emp.deleted != null;

        return `
            <tr>
                <td>${escapeHTML(emp.id)}</td>
                <td>${escapeHTML(emp.name)}</td>
                <td>${escapeHTML(emp.age)}</td>
                <td>${escapeHTML(emp.city)}</td>
                <td>${escapeHTML(emp.email)}</td>

                <td>
                    <span class="status ${
                        isDeleted ? "deleted-status" : "active-status"
                    }">
                        ${isDeleted ? "Deleted" : "Active"}
                    </span>
                </td>

                <td>
                    ${
                        isDeleted
                        ? `<button class="action-btn restore-btn"
                            data-action="restore"
                            data-id="${Number(emp.id)}">
                            Restore
                           </button>`
                        : `<button class="action-btn delete-btn"
                            data-action="delete"
                            data-id="${Number(emp.id)}">
                            Delete
                           </button>`
                    }
                </td>
            </tr>
        `;

    }).join("");
}


// POST: Add employee
employeeForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const employee = {
        name: document.getElementById("name").value.trim(),
        age: Number(document.getElementById("age").value),
        city: document.getElementById("city").value.trim(),
        email: document.getElementById("email").value.trim()
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(employee)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || result.message || "Failed to add employee");
        }

        employeeForm.reset();
        closeModal();

        currentFilter = "active";
        updateActiveNavigation();

        await fetchEmployees();

        showMessage("Employee added successfully!");

    } catch (error) {
        showMessage(error.message, true);
    }

});


// DELETE: Soft delete employee
async function deleteEmployee(id) {

    if (!confirm("Are you sure you want to delete this employee?")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Delete failed");
        }

        await fetchEmployees();

        showMessage("Employee deleted successfully!");

    } catch (error) {
        showMessage(error.message, true);
    }
}


// PUT: Restore employee
async function restoreEmployee(id) {

    try {
        const response = await fetch(`${API_URL}/restore/${id}`, {
            method: "PUT"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Restore failed");
        }

        await fetchEmployees();

        showMessage("Employee restored successfully!");

    } catch (error) {
        showMessage(error.message, true);
    }
}


// Handle table action buttons
employeeTable.addEventListener("click", (event) => {

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "delete") {
        deleteEmployee(id);
    }

    if (action === "restore") {
        restoreEmployee(id);
    }
});


// Filter navigation
document.querySelectorAll(".nav-link").forEach(link => {

    link.addEventListener("click", (event) => {

        event.preventDefault();

        currentFilter = link.dataset.filter;

        updateActiveNavigation();
        displayEmployees();

    });

});


// Highlight selected navigation
function updateActiveNavigation() {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.filter === currentFilter
        );
    });
}


// Search
searchInput.addEventListener("input", displayEmployees);


// Open modal
document.getElementById("openModal").addEventListener("click", () => {
    employeeModal.style.display = "flex";
});


// Close modal
document.getElementById("closeModal").addEventListener("click", closeModal);

function closeModal() {
    employeeModal.style.display = "none";
}

employeeModal.addEventListener("click", (event) => {
    if (event.target === employeeModal) {
        closeModal();
    }
});


// Load employees when page opens
fetchEmployees();
