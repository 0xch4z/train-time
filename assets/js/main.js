const elements = {
  trainName: $('#train-name'),
  destination: $('#destination'),
  firstTime: $('#first-time'),
  frequencey: $('#frequency'),
}

const config = {
  apiKey: "AIzaSyBm2PCaS8mhLPTPu_YGKulXh7iuhFFUSMg",
  authDomain: "train-time-1da2b.firebaseapp.com",
  databaseURL: "https://train-time-1da2b.firebaseio.com",
  projectId: "train-time-1da2b",
  storageBucket: "train-time-1da2b.appspot.com",
  messagingSenderId: "179546706140"
};

firebase.initializeApp(config);

let initalized = false
let modalAction;

const currentTime = moment()
const db = firebase.database()
const trains = db.ref('trains')

function makeRowFragment({ name, dest, freq, nextArrival, minutesAway, id }) {
  return `
    <tr entity-id="${id}">
      <td>${name}</td>
      <td>${dest}</td>
      <td>${freq}</td>
      <td>${nextArrival}</td>
      <td>${minutesAway}</td>
    </tr>
  `
}

function clearForm() {
  Object.values(elements).forEach(function(el) {
    el.val('')
  })
}

function calculateTrainDiff(firstTime, freq) {
  const time = moment(firstTime, 'H:mm', true)
  const mDiff = moment().diff(time, 'minutes')
  const minutesAway = Math.floor(mDiff % freq)
  const rem = freq - minutesAway
  const nextArrival = currentTime.add(rem, 'm').format('H:mm')
  return { minutesAway, nextArrival }
}

trains.orderByChild('dateAdded').on('child_added', function(data) {
  // exit if not initalized table
  if (!initalized) return
  const { key } = data
  const entry = data.val()
  const times = calculateTrainDiff(entry.firstTime, entry.freq)  
  const row = makeRowFragment({ ...entry, ...times, id: key })
  // append to table
  $('#trains').append(row)
})

trains.orderByChild('dateAdded').once('value', function(data) {
  initalized = true
  // generate table
  let markup = ''
  const entries = data.val()
  const ids = Object.keys(entries)
  for (const id of ids) {
    const entry = entries[id]
    const times = calculateTrainDiff(entry.firstTime, entry.freq) 
    markup += makeRowFragment({ ...entry, ...times, id })
  }
  // add rows to table
  $('#trains').html(markup)
})

trains.on('child_removed', function(data) {
  // select by id and remove
  const { key } = data
  $(`tr[entity-id='${key}']`).remove()
})

$('#form').submit(function(e) {
  e.preventDefault()
  // get form data
  const name = elements.trainName.val()
  const dest = elements.destination.val()
  const firstTime = elements.firstTime.val()
  const freq = elements.frequencey.val()
  // validate input
  if (!name) {
    return Materialize.toast('Name is required!', 1000)
  } else if (!dest) {
    return Materialize.toast('Destination is required!', 1000)
  } else if (!firstTime) {
    return Materialize.toast('First time is required', 1000)
  } else if (!moment(firstTime, 'H:mm', true).isValid()) {
    return Materialize.toast('Invalid first time', 1000)
  } else if (!freq || Number.isInteger(freq)) {
    return Materialize.toast('Invalid frequency', 1000)
  }
  // save train entry
  trains.push({ name, dest, firstTime, freq })
  // clear form
  clearForm()
})

$(document).on('click', 'tr', function() {
  console.log(this)
  // get id
  const id = $(this).attr('entity-id')
  // remove from firebase
  trains.child(id).remove()
})

function deleteRow() {
  console.log('foo')
}

$('#first-time').pickatime({
  default: 'now',
  twelvehour: false,
})
