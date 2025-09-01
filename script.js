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
            console.log('coucou');
            todolist.appendChild(li);
        }
        element.value = "";
        element.focus();
    }

    form.addEventListener("submit", addElementInList);
});