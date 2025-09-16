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
            applyFilterFromHash();
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
    applyFilterFromHash();
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

/** @param {KeyboardEvent} event */
function keydownDelete(event) {
    if (!(event.target instanceof Element)) return;
    if (event.target.matches('.edit')) return;
    if (!(event.key === 'Delete') && !(event.key === 'Backspace')) return;
    event.preventDefault();
    const li = event.target.closest('li');
    if (!(li instanceof HTMLLIElement)) return;
    if (li.classList.contains('editing')) return;

    const next = li.nextElementSibling;
    const prev  = li.previousElementSibling;
    const toFocus =
        next instanceof HTMLElement ? next :
        prev instanceof HTMLElement ? prev :
        element;

    const pending = labelClickTimers.get(li);
    if (pending) {
        clearTimeout(pending);
        labelClickTimers.delete(li);
    }

    li.remove();
    saveState();
    applyFilterFromHash();
    toFocus && toFocus.focus( { preventScroll: true });
}

/** @param {KeyboardEvent} event */
function keydownNextOrPreviousElement(event) {
    if (!(event.target instanceof Element)) return;
    if (event.target.matches('.edit')) return;
    if (!(event.key === "ArrowDown") && !(event.key === "ArrowUp")) return;
    event.preventDefault();
    const li = event.target.closest('li');
    if (!(li instanceof HTMLLIElement)) return;
    let toFocus;
    if (event.key == "ArrowDown") {
        const next = li.nextElementSibling;
        if (next instanceof HTMLLIElement) { toFocus = next; }
    }
    else {
        const prev  = li.previousElementSibling;
        if (prev instanceof HTMLLIElement) { toFocus = prev; }
    }
    toFocus && toFocus.focus( { preventScroll: true });
}

/** @param {string|undefined} hash */
function normalizeHash(hash) {
    let h = String(hash ?? '').trim().toLowerCase();

    if (h.startsWith('#')) { h = h.slice(1); }
    if (h.search(/[?#]/) != -1) { h = h.slice(0, h.search(/[?#]/)); }
    h = h.replace(/\/+/g, '/');
    if (h && !h.startsWith('/')) { h = '/' + h };
    if (h !== '/' && h.endsWith('/')) { h = h.slice(0, -1) };

    if (h === "" || h === "/") { return "#/"; }
    if (h === "/active") { return "#/active"; }
    if (h === "/completed") { return "#/completed"; }
    return "#/";
}

/** @param {string|undefined} route */
function predicateFor(route) {
    switch (route) {
        case "#/":          return () => true; 
        case "#/active":    return (/** @type {{ done: any; }} */ item) => !item.done;
        case "#/completed": return (/** @type {{ done: any; }} */ item) => item.done;
        default:            return () => true;
    }
}

/**
 * @param {'all'|'active'|'completed'} mode
 * @returns {string} label du lien actif (utile pour la live-region)
 */
function setActiveFilterUI(mode) {
    const nav = document.getElementById('filters');
    if (!nav) return '';
    const links = nav.querySelectorAll('a');
    let activeLabel = '';

    links.forEach(a => {
        const isActive = (a.dataset.filter === mode);
        a.classList.toggle('is-active', isActive);
        if (isActive) {
            a.setAttribute('aria-current','page');
            activeLabel = a.textContent.trim();
        }
        else {
            a.removeAttribute('aria-current');
        }
    });
    return activeLabel;
}

/**
 * @param {'#/'|'#/active'|'#/completed'|string} route
 * @returns {{mode:'all'|'active'|'completed', label:'Tous'|'Actifs'|'Terminés'}}
 */
function routeToUI(route) {
    route = normalizeHash(route);
    switch (route) {
        case '#/': return { mode: 'all', label: 'Tous' };
        case '#/active': return { mode: 'active', label: 'Actifs' };
        case '#/completed': return { mode: 'completed', label: 'Terminés' };
        default: return { mode: 'all', label: 'Tous' };
    }
}

/**
 * Applique le filtre en masquant/affichant les <li>.
 * @param {(item: {done:boolean}) => boolean} predicate
 * @returns {number} nombre d'items visibles
 */
function applyFilterToList(predicate) {
    const ul = document.getElementById('to-do-list');
    if (!ul) return 0;

    const items = ul.querySelectorAll('li');
    let visible = 0;

    items.forEach(li => {
        const done = li.classList.contains('done');

        // Si l'item est en édition, on le garde toujours visible
        const isEditing = li.classList.contains('editing');
        const keep = isEditing ? true : predicate({ done });

        li.hidden = !keep;

        if (keep) visible++;
    });

    return visible;
}

function applyFilterFromHash() {
    const route = normalizeHash(window.location.hash);
    const { mode, label } = routeToUI(route);
    const predicate = predicateFor(route);

    const activeLabel = setActiveFilterUI(mode);

    const count = applyFilterToList(predicate);

    updateLiveRegion(activeLabel || label, count);
}

/**
 * @param {string} label
 * @param {number} count
 */
function updateLiveRegion(label, count) {
    const srStatus = document.querySelector("#sr-status");
    if (!srStatus) return;
    srStatus.textContent = `${label} — ${count} tâches`;
}

loadState();
applyFilterFromHash();

form.addEventListener("submit", addElementInList);
todolist.addEventListener("click", clickElement);
todolist.addEventListener("keydown", handleEditKeys);
todolist.addEventListener('focusout', handleEditBlur);
todolist.addEventListener("keydown", keydownElementDone);
todolist.addEventListener("keydown", keydownStartEdit);
todolist.addEventListener("keydown", keydownDelete);
todolist.addEventListener("keydown", keydownNextOrPreviousElement);
todolist.addEventListener("dblclick", editElement);
window.addEventListener('load', applyFilterFromHash);
window.addEventListener('hashchange', applyFilterFromHash);
