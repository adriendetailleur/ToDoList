// @ts-check
const STORAGE_KEY = 'todos';

const labelClickTimers = new WeakMap();
const CLICK_DELAY_MS = 200;

/** @type {HTMLFormElement | null} */
const form = document.querySelector('form');
/** @type {HTMLInputElement | null} */
const element = document.querySelector('#element');
/** @type {HTMLUListElement | null} */
const todolist = document.querySelector('#to-do-list');

// Vérification au démarrage (narrowing runtime + type-safe)
if (!form || !element || !todolist) {
  throw new Error('DOM manquant: form, #element ou #to-do-list introuvable.');
}

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

/**
 * @param {{ preventDefault: () => void; }} event
 */
function addElementInList(event) {
    event.preventDefault();
    const text = element.value.trim();
    if (text !== "")
    {
        const li = createToDoItem(text);
        todolist.appendChild(li);
        saveState();
    }
    element.value = "";
    element.focus();
}

/**
 * @param {string} text
 */
function createToDoItem(text, done=false) {
    const li = document.createElement("li");
    const label = document.createElement('span');
    label.className = 'label';
    label.title = 'Double-cliquez pour modifier'
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

/** @param {MouseEvent} event */
function clickElement(event) {
    if (!(event.target instanceof Element)) return;
    if (event.detail > 1) return; // ignore dblclicks
    const removeCtrl = event.target.closest('.remove');
    const selectedElement = event.target.closest('li');
    if (!selectedElement || !todolist.contains(selectedElement)) return;
    if (selectedElement.classList.contains('editing')) return;

    if (event.target.closest('.label')) {
        const pending = labelClickTimers.get(selectedElement);
        if (pending)
        {
            clearTimeout(pending);
            labelClickTimers.delete(selectedElement);
        }
        const id = setTimeout(() => {
            labelClickTimers.delete(selectedElement);
            if (!todolist.contains(selectedElement)) return;
            if (selectedElement.classList.contains('editing')) return;

            selectedElement.classList.toggle('done');
            saveState();
        }, CLICK_DELAY_MS);

        labelClickTimers.set(selectedElement, id);
        return;
    }

    if (removeCtrl)
    {
        const pending = labelClickTimers.get(selectedElement);
        if (pending) {
            clearTimeout(pending);
            labelClickTimers.delete(selectedElement);
        }
        todolist.removeChild(selectedElement);
        saveState();
        return;
    }

    if (!selectedElement || !todolist.contains(selectedElement)) return;

    selectedElement.classList.toggle("done");
    saveState();
}

/** @param {KeyboardEvent} event */
function keydownElementDone(event) {
    if (!(event.target instanceof Element)) return;
    if (event.target.matches('.edit')) return;

    if (event.target.closest('.remove')) return;
    if (event.code !== 'Space' && event.code !== 'Enter') return;
    if (event.code === 'Space') event.preventDefault();

    const selectedElement = event.target.closest('li');
    if (!selectedElement || !todolist.contains(selectedElement)) return;
    if (selectedElement.classList.contains('editing')) return;
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

/** @param {MouseEvent} event */
function editElement(event) {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('.remove')) return;
    const label = event.target.closest('.label');
    if (!label) return;

    const li = label.closest('li');
    if (!(li instanceof HTMLLIElement)) return;
    if (li.classList.contains('editing')) return;

    startEdit(li);
}

/** @param {HTMLLIElement} li */
function startEdit(li) {
    if (!li || li.classList.contains('editing')) return;
    const label = li.querySelector('.label');
    if (!label || li.querySelector('.edit')) return;

    const pending = labelClickTimers.get(li);
    if (pending) {
        clearTimeout(pending);
        labelClickTimers.delete(li);
    }

    li.classList.add('editing');

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit';
    input.setAttribute('aria-label', 'Modifier la tâche');

    input.value = label.textContent;
    input.dataset.prev = label.textContent;

    label.after(input);
    input.focus();
    input.setSelectionRange(0, input.value.length);
}

/** @param {KeyboardEvent} event */
function handleEditKeys(event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (!event.target.matches('.edit')) return;
    if (event.key !== 'Enter' && event.key !== 'Escape') return;
    event.preventDefault();
    if (event.key === 'Enter') {
        event.target.blur();
    }
    else if (event.key === 'Escape') {
        event.stopPropagation();
        cancelEdit(event.target);
    }
}

/** @param {FocusEvent} event */
function handleEditBlur(event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (!event.target.matches('.edit')) return;
    if (event.target.dataset.cancelled === "1") return;
    finalizeEdit(event.target);     
}

/** @param {HTMLInputElement} input */
function finalizeEdit(input) {
    const li = input.closest('li');
    const label = li?.querySelector('.label');
    if (!li || !label) return;

    const prevValue = input.dataset.prev ?? label.textContent;
    const nextValue = input.value.trim();

    if (!nextValue) {
        label.textContent = prevValue;
    }
    else if (nextValue !== prevValue) {
        label.textContent = nextValue;
        saveState();
    }
    li.classList.remove('editing');
    input.remove();
    li.focus();
}

/** @param {HTMLInputElement} input */
function cancelEdit(input) {
    const li = input.closest('li');
    const label = li?.querySelector('.label');
    if (!li || !label) return;

    input.dataset.cancelled = "1";
    label.textContent = input.dataset.prev;
    li.classList.remove('editing');
    input.remove();
    li.focus();
}

 /** @param {KeyboardEvent} event */
function keydownStartEdit(event) {
    if (!(event.target instanceof Element)) return;
    if (event.target.matches('.edit')) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (!(event.code === 'F2') && !(event.key.toLowerCase() === 'e')) return;
    const li = event.target.closest('li');
    if (!(li instanceof HTMLLIElement)) return;
    event.preventDefault();
    startEdit(li);
}

loadState();

form.addEventListener("submit", addElementInList);
todolist.addEventListener("click", clickElement);
todolist.addEventListener("keydown", handleEditKeys);
todolist.addEventListener('focusout', handleEditBlur);
todolist.addEventListener("keydown", keydownElementDone);
todolist.addEventListener("keydown", keydownStartEdit);
todolist.addEventListener("dblclick", editElement);
