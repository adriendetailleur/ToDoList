document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const element = document.querySelector('#element');
    const todolist = document.querySelector('#to-do-list');

    function addElementInList(event) {
        event.preventDefault();
        if (element.value.trim() != "")
        {
            const li = document.createElement("li");
            const label = document.createElement('span');
            label.className = 'label';
            label.textContent = element.value.trim();
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';                 // évite une soumission du form
            removeBtn.className = 'remove';
            removeBtn.setAttribute('aria-label', 'Supprimer');
            removeBtn.textContent = '✕'; 
            li.tabIndex = 0;
            li.appendChild(label);
            li.appendChild(removeBtn);
            todolist.appendChild(li);
        }
        element.value = "";
        element.focus();
    }

    function clickElement(event) {
        const removeCtrl = event.target.closest('.remove');
        const selectedElement = event.target.closest('li');
        if (removeCtrl)
        {
            todolist.removeChild(selectedElement);
            return;
        }
        if (!selectedElement || !todolist.contains(selectedElement)) return;
        selectedElement.classList.toggle("done");
    }

    function keydownElementDone(event) {
        if (event.target.closest('.remove')) return;
        if (event.code !== 'Space' && event.code !== 'Enter') return;

        const selectedElement = event.target.closest('li');
        if (!selectedElement || !todolist.contains(selectedElement)) return;
        if (event.code !== 'Space' && event.code !== 'Enter') return;
        selectedElement.classList.toggle("done");
    }

    form.addEventListener("submit", addElementInList);
    todolist.addEventListener("click", clickElement);
    todolist.addEventListener("keydown", keydownElementDone);
});