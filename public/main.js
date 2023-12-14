// Function to switch which recipient is displayed
async function changeRecipient(event) {
  if (event.target.value !== '') {
    // Show the person information div
    document.getElementById('personInfo').classList.remove('hidden')

    // Get the person's information from the database
    let result = await axios.get(`/person/${event.target.value}`)
    let data = result.data[0]
    document.getElementById('personName').innerText = data.name
    document.getElementById('budgetData').innerText = data.budget
    document.getElementById('id').value = data.id
    document.getElementById('personId').value = data.id

    await loadGifts(event.target.value)
  } else {
    document.getElementById('personInfo').classList.add('hidden')
  }
}

// Function to load gift information
async function loadGifts() {
  const personId = document.getElementById('id').value

  // Reset add gift form
  document.getElementById('itemName').value = ''
  document.getElementById('price').value = ''
  document.getElementById('purchased').checked = false

  // Get the gift information from the database
  result = await axios.get(`/gift/${personId}`)
  data = result.data

  // Load the data into the UI
  let amountSpent = 0
  const giftIdeas = document.getElementById('giftIdeas')
  const giftsPurchased = document.getElementById('giftsPurchased')
  giftIdeas.innerHTML = ''
  giftsPurchased.innerHTML = ''
  data.forEach((gift) => {
    if (gift.purchased == 1) {
      giftsPurchased.innerHTML += `<div class="giftDiv flex flex-row justify-between gap-2" giftId="${gift.id}">
        <p class="grow">${gift.item_name}, &#36;${gift.price}</p>
        <button type="button" class="giftDeleteBtn px-2 bg-red-700 rounded">-</button>
      </div>`
      amountSpent += gift.price
    } else {
      giftIdeas.innerHTML += `<div class="giftDiv flex flex-row justify-between gap-2" giftId="${gift.id}">
        <p class="grow">${gift.item_name}, &#36;${gift.price}</p>
        <button type="button" class="giftDeleteBtn px-2 bg-emerald-700 rounded">-</button>
        <button type="button" class="giftPurchaseBtn px-2 bg-emerald-700 rounded">+</button>
      </div>`
    }
  })

  // Add the htmx
  let gifts = document.getElementsByClassName('giftDeleteBtn')
  for (let i = 0; i < gifts.length; i++) {
    gifts[i].addEventListener('click', deleteGift)
  }
  let purchaseBtns = document.getElementsByClassName('giftPurchaseBtn')
  for (let i = 0; i < purchaseBtns.length; i++) {
    purchaseBtns[i].addEventListener('click', purchaseGift)
  }

  // Add the amount spent to the UI
  document.getElementById('spentData').innerText = amountSpent
}

// Function to delete a gift
async function deleteGift(event) {
  let giftId = event.target.parentElement.getAttribute('giftId')

  const result = await axios.delete(`/gift/${giftId}`)
  await loadGifts()
}

// Function to mark a gift purchased
async function purchaseGift(event) {
  let giftId = event.target.parentElement.getAttribute('giftId')

  const result = await axios.put(`/gift/${giftId}`)
  await loadGifts()
}

// Function to add a gift
async function addGift() {
  const personId = document.getElementById('person')
  const itemName = document.getElementById('itemName')
  const price = document.getElementById('price')
  const purchased = document.getElementById('purchased')

  const giftDetails = {
    personId: personId.value,
    itemName: itemName.value,
    price: price.value,
    purchased: purchased.checked
  }

  let result = await axios.post('/gift', giftDetails)
  itemName.value = ''
  price.value = ''
  purchased.checked = false
  await loadGifts(document.getElementById('person').value)
}

function editBudget() {
  // Hide the edit button and budget amount
  // and show the form to edit the budget
  document.getElementById('editBudgetBtn').classList.add('hidden')
  document.getElementById('budgetData').classList.add('hidden')
  document.getElementById('updateBudgetForm').classList.remove('hidden')
  document.getElementById('budgetInput').value = document.getElementById('budgetData').innerText
  document.getElementById('budgetInput').focus()
}

function showBudget(){
  // Show the edit button and budget amount
  // and hide the form to edit the budget
  document.getElementById('editBudgetBtn').classList.remove('hidden')
  document.getElementById('budgetData').classList.remove('hidden')
  document.getElementById('updateBudgetForm').classList.add('hidden')
}

// Function to enable/disable the add recipient button when the input is changed
function toggleAddBtn(event) {
  if (event.target.value === '') {
    document.getElementById('addRecipient').disabled = true;
  } else {
    document.getElementById('addRecipient').disabled = false;
  }
}

// Clear add recipient input after creating a new recipient
function clearAddInput() {
  document.getElementById('recipientName').value = ''
  document.getElementById('addRecipient').disabled = true;
}

// Only enable add gift button when form is filled in
function toggleAddGiftBtn() {
  const addGiftBtn = document.getElementById('addGift')
  const itemName = document.getElementById('itemName')
  const price = document.getElementById('price')
  if (itemName.value != '' && price.value != '') {
    addGiftBtn.disabled = false
  } else {
    addGiftBtn.disabled = true
  }
}

// Add event listeners
document.getElementById('person').addEventListener('change', changeRecipient)
document.getElementById('editBudgetBtn').addEventListener('click', editBudget)
document.getElementById('submitBudgetBtn').addEventListener('click', showBudget)
document.getElementById('recipientName').addEventListener('input', toggleAddBtn)
document.getElementById('itemName').addEventListener('input', toggleAddGiftBtn)
document.getElementById('price').addEventListener('input', toggleAddGiftBtn)
document.body.addEventListener('returnPersonEvent', clearAddInput)
document.body.addEventListener('reloadGifts', loadGifts)
