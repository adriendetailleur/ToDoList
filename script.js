document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const element = document.querySelector('#element');
    const todolist = document.querySelector('#to-do-list');

    function addElementInList(event) {
        event.preventDefault();
        if (element.value.trim() != "")
        {
            const li = document.createElement("li");
            li.textContent = element.value.trim();
            todolist.appendChild(li);
        }
        element.value = "";
        element.focus();
    }

    function elementDone(event) {
        selectedElement = event.target.closest('li');
        selectedElement.classList.toggle("done");
    }

    form.addEventListener("submit", addElementInList);
    todolist.addEventListener("click", elementDone);
});