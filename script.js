const STORAGE_KEY = 'todos';

const form = document.querySelector('form');
const element = document.querySelector('#element');
const todolist = document.querySelector('#to-do-list');

function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { return; }

    let data;
    try { data = JSON.parse(raw); }
    catch { return; }

    if (!Array.isArray(data)) { return; }

    todolist.innerHTML = '';

    for (const item of data)
    {
        if (!item?.text?.trim()) { continue; }
        todolist.appendChild(createToDoItem(item.text, item.done));
    }
}

function addElementInList(event) {
    event.preventDefault();
    const text = element.value.trim();
    if (text != "")
    {
        const li = createToDoItem(text);
        todolist.appendChild(li);
        saveState();
    }
    element.value = "";
    element.focus();
}

function createToDoItem(text, done=false) {
    const li = document.createElement("li");
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = text;
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove';
    removeBtn.setAttribute('aria-label', 'Supprimer');
    removeBtn.textContent = '✕'; 
    li.classList.toggle("done", done);
    li.tabIndex = 0;
    li.appendChild(label);
    li.appendChild(removeBtn);
    return li;
}

function clickElement(event) {
    const removeCtrl = event.target.closest('.remove');
    const selectedElement = event.target.closest('li');
    if (removeCtrl)
    {
        todolist.removeChild(selectedElement);
        saveState();
        return;
    }
    if (!selectedElement || !todolist.contains(selectedElement)) return;
    selectedElement.classList.toggle("done");
    saveState();
}

function keydownElementDone(event) {
    if (event.target.closest('.remove')) return;
    if (event.code !== 'Space' && event.code !== 'Enter') return;
    if (event.code === 'Space') event.preventDefault();
    const selectedElement = event.target.closest('li');
    if (!selectedElement || !todolist.contains(selectedElement)) return;
    selectedElement.classList.toggle("done");
    saveState();
}

function saveState() {
    const items = todolist.querySelectorAll('li');
    const cleaned = [];
    for (const li of items)
    {
        const elementLabel = li.querySelector('.label');
        const text = (elementLabel?.textContent ?? '').trim();
        if (!text) continue;

        const done = li.classList.contains('done');
        cleaned.push({ text, done });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
}

function editElement(event) {
    if (event.target.closest('.remove')) return;
    const label = event.target.closest('.label');
    if (!label) return;
    const li = label.closest('li');
    if (!li || li.classList.contains('editing')) return;
    li.classList.add('editing');

    const input = document.createElement('input');
    input.type = "text";
    input.className = "edit";
    input.value = label.textContent;
    input.setAttribute('aria-label', 'Modifier la tâche');
    label.after(input);

    input.focus();
    input.setSelectionRange(0, input.value.length);
    input.dataset.prev = label.textContent;
}

loadState();

form.addEventListener("submit", addElementInList);
todolist.addEventListener("click", clickElement);
todolist.addEventListener("keydown", keydownElementDone);
todolist.addEventListener("dblclick", editElement);
