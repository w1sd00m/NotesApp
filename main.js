class Note {
  constructor(title, contents='') {
    this.title = title
    this.contents = contents
    this.created = new Date()
    this.modified = new Date()
  }
  
  edit(title, contents) {
    this.title = title
    this.contents = contents
    this.modified = new Date()
  }
}

const AppState = {
  Idle: 0,
  Creating: 1,
  Inspecting: 2,
  Editing: 3
}

const ChangeType = {
  Add: 0,
  Edit: 1,
  Remove: 2
}

const notes = []
const topbarTitle = document.getElementById('topbar-title')
const notesList = document.getElementById('notes-list')
const inspector = document.getElementById('inspector')
const noteTitleInput = document.getElementById('note-title')
const noteContentsInput = document.getElementById('note-contents')
const actionBtns = {
  create: document.getElementById('btn-create-note'),
  inspect: document.getElementById('btn-inspect-note'),
  edit: document.getElementById('btn-edit-note'),
  remove: document.getElementById('btn-remove-note'),
  save: document.getElementById('btn-save-changes'),
  cancel: document.getElementById('btn-discard-changes')
}

let appState = AppState.Idle
let selectedItem = null

window.onload = () => {
  notesList.onclick = (e) => {
    if (e.target === notesList) {
      selectedItem?.setAttribute('data-selected', 'false')
      selectedItem = null
      setActive(false, ...Object.values(actionBtns))
      setActive(true, actionBtns.create)
    }
  }
  
  checkStorage()
}

window.onunload = () => {
  updateStorage()
}

function setActive(active, ...elements) {
  for (let element of elements) {
    element.setAttribute('data-active', String(active))
  }
}

function checkStorage() {
  let json = localStorage.getItem('NotesApp.Notes')
  
  if (json) {
    loadNotes(json)
  } else {
    localStorage.setItem('NotesApp.Notes', '')
  }
}

function loadNotes(json) {
  let savedNotes = JSON.parse(json, (key, val) => {
    if (key === 'created' || key === 'modified')
      return new Date(Date.parse(val))
    
    return val
  })
  
  for (let savedNote of savedNotes) {
    let note = Object.assign(new Note, savedNote)
    notes.push(note)
    onNotesChanged(ChangeType.Add, { note })
  }
}

function updateStorage() {
  localStorage.setItem('NotesApp.Notes', JSON.stringify(notes))
}

function showInspector() {
  setActive(false, notesList)
  setActive(false, ...Object.values(actionBtns))
  
  switch (appState) {
    case AppState.Creating: {
      topbarTitle.textContent = 'New Note'
      setActive(false, inspector.querySelector('#note-info'))
      setActive(true, actionBtns.save, actionBtns.cancel)
      break
    }
    
    case AppState.Inspecting:
    case AppState.Editing: {
      let itemIndex = Array.from(notesList.children).indexOf(selectedItem)
      let note = notes[itemIndex]
      noteTitleInput.value = note.title
      noteContentsInput.value = note.contents
      setActive(true, actionBtns.cancel)
      
      if (appState === AppState.Inspecting) {
        topbarTitle.textContent = note.title
        noteTitleInput.readOnly = true
        noteContentsInput.readOnly = true
        document.getElementById('note-creation-date').textContent = note.created.toDateString()
        document.getElementById('note-modified-date').textContent = note.modified.toDateString()
        setActive(true, inspector.querySelector('#note-info'))
      } else {
        topbarTitle.textContent = `Edit - ${note.title}`
        noteTitleInput.readOnly = false
        noteContentsInput.readOnly = false
        setActive(true, actionBtns.save)
        setActive(false, inspector.querySelector('#note-info'))
      }
      
      break
    }
  }
  
  setActive(true, inspector)
}

function hideInspector() {
  topbarTitle.textContent = 'Your Notes'
  setActive(false, ...Object.values(actionBtns))
  setActive(true, actionBtns.create)
  
  if (selectedItem)
    setActive(true, actionBtns.inspect, actionBtns.edit, actionBtns.remove)
  
  setActive(false, inspector)
  noteTitleInput.value = ''
  noteContentsInput.value = ''
  noteTitleInput.readOnly = false
  noteContentsInput.readOnly = false
  setActive(true, notesList)
  appState = AppState.Idle
}

function onNotesChanged(type, args) {
  let note = args.note
  
  switch (type) {
    case ChangeType.Add: {
      let item = document.createElement('li')
      let hr = document.createElement('hr')
      let title = document.createElement('p')
      let created = document.createElement('p')
      title.textContent = note.title
      created.textContent = note.created.toDateString()
      item.appendChild(hr)
      item.appendChild(title)
      item.appendChild(created)
      item.appendChild(hr.cloneNode())
      item.onclick = () => onItemClicked(item)
      notesList.appendChild(item)
      break
    }
    
    case ChangeType.Edit: {
      notesList.children[args.itemIndex]
               .querySelector('p:first-of-type')
               .textContent = note.title
      break
    }
    
    case ChangeType.Remove: {
      notesList.children[args.itemIndex].remove()
      break
    }
  }
}

function onItemClicked(item) {
  selectedItem?.setAttribute('data-selected', 'false')
  item.setAttribute('data-selected', 'true')
  selectedItem = item
  setActive(true, actionBtns.inspect, actionBtns.edit, actionBtns.remove)
}

function createNote() {
  appState = AppState.Creating
  showInspector()
}

function inspectNote() {
  if (!selectedItem)
    return
  
  appState = AppState.Inspecting
  showInspector()
}

function editNote() {
  if (!selectedItem)
    return
  
  appState = AppState.Editing
  showInspector()
}

function deleteNote() {
  if (!selectedItem)
    return
  
  let itemIndex = Array.from(notesList.children).indexOf(selectedItem)
  let note = notes[itemIndex]
  
  if (confirm(`Delete "${note.title}"?`)) {
    notes.splice(itemIndex, 1)
    onNotesChanged(ChangeType.Remove, { itemIndex })
    selectedItem = null
    setActive(false, actionBtns.inspect, actionBtns.edit, actionBtns.remove)
  }
}

function saveChanges() {
  switch (appState) {
    case AppState.Creating: {
      let title = noteTitleInput.value
      let contents = noteContentsInput.value
      let note = new Note(title, contents)
      notes.push(note)
      onNotesChanged(ChangeType.Add, { note })
      break
    }
    
    case AppState.Inspecting: {
      hideInspector()
      break
    }
    
    case AppState.Editing: {
      let itemIndex = Array.from(notesList.children).indexOf(selectedItem)
      let note = notes[itemIndex]
      let title = noteTitleInput.value
      let contents = noteContentsInput.value
      note.edit(title, contents)
      onNotesChanged(ChangeType.Edit, { note, itemIndex })
      break
    }
  }
  
  hideInspector()
}

function cancelChanges() {
  switch (appState) {
    case AppState.Creating:
    case AppState.Editing: {
      if (confirm('Discard Changes?'))
        hideInspector()
      break
    }
    
    case AppState.Inspecting: {
      hideInspector()
      break
    }
  }
}
