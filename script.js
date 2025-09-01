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
            li.tabIndex = "0";
            todolist.appendChild(li);
        }
        element.value = "";
        element.focus();
    }

    function clickElementDone(event) {
        const selectedElement = event.target.closest('li');
        if (!selectedElement || !todolist.contains(selectedElement)) return;
        selectedElement.classList.toggle("done");
    }

    function keydownElementDone(event) {
        if (event.code !== 'Space' && event.code !== 'Enter') return;

        const selectedElement = event.target.closest('li');
        if (!selectedElement || !todolist.contains(selectedElement)) return;
        if (event.code !== 'Space' && event.code !== 'Enter') return;
        selectedElement.classList.toggle("done");
    }

    form.addEventListener("submit", addElementInList);
    todolist.addEventListener("click", clickElementDone);
    todolist.addEventListener("keydown", keydownElementDone);
});