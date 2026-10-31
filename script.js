const TRANSACTION_STORAGE_KEY = "transactions";
const TRANSACTION_SCHEMA_VERSION = 1;
const TRANSACTION_TYPES = ["Expense", "Money Received"];
const AMOUNT_PATTERN = /^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/;

const parseAmountToPaise = (value) => {
  const normalizedValue = String(value).trim();
  if (!AMOUNT_PATTERN.test(normalizedValue)) {
    return null;
  }

  const [rupees = "0", paise = ""] = normalizedValue.split(".");
  const amountInPaise =
    BigInt(rupees || "0") * 100n + BigInt((paise + "00").slice(0, 2));

  return amountInPaise > 0n && amountInPaise <= BigInt(Number.MAX_SAFE_INTEGER)
    ? Number(amountInPaise)
    : null;
};

const formatINR = (amountInPaise) => {
  if (!Number.isSafeInteger(amountInPaise)) {
    throw new RangeError("The amount is outside the supported range.");
  }

  const negative = amountInPaise < 0;
  const absoluteAmount = BigInt(Math.abs(amountInPaise));
  const rupees = absoluteAmount / 100n;
  const paise = String(absoluteAmount % 100n).padStart(2, "0");
  const formattedRupees = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);

  return `${negative ? "-" : ""}${formattedRupees}.${paise}`;
};

const calculateAvailableBalance = (transactions) =>
  transactions.reduce((balance, transaction) => {
    const signedAmount =
      transaction.type === "Money Received"
        ? transaction.amountInPaise
        : -transaction.amountInPaise;
    const nextBalance = balance + signedAmount;

    if (!Number.isSafeInteger(nextBalance)) {
      throw new RangeError("The available balance is outside the supported range.");
    }

    return nextBalance;
  }, 10_000);

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatTransactionDate = (dateString) => {
  if (!isValidTransactionDate(dateString)) {
    throw new TypeError("The transaction date is invalid.");
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  return `${match[3]}/${match[2]}/${match[1]}`;
};

const isValidTransactionDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const daysInMonth = [
    31,
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return year > 0 && month >= 1 && month <= 12 && day >= 1 &&
    day <= daysInMonth[month - 1];
};

const validateTransaction = ({ amount, type, date }) => {
  const errors = {};
  const amountInPaise = parseAmountToPaise(amount);

  if (amountInPaise === null) {
    errors.amount = "Enter an amount greater than zero with no more than two decimal places.";
  }
  if (!TRANSACTION_TYPES.includes(type)) {
    errors.type = "Choose Expense or Money Received.";
  }
  if (!isValidTransactionDate(date)) {
    errors.date = "Enter a valid transaction date.";
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    amountInPaise,
  };
};

const isStoredTransaction = (transaction) =>
  transaction !== null &&
  typeof transaction === "object" &&
  typeof transaction.id === "string" &&
  TRANSACTION_TYPES.includes(transaction.type) &&
  Number.isSafeInteger(transaction.amountInPaise) &&
  transaction.amountInPaise > 0 &&
  isValidTransactionDate(transaction.date) &&
  (transaction.note === undefined || typeof transaction.note === "string");

const createStorageError = (message, cause) => {
  const error = new Error(message);
  error.cause = cause;
  return error;
};

const readTransactionStorage = () => {
  try {
    return window.localStorage;
  } catch (error) {
    throw createStorageError("Browser storage is unavailable.", error);
  }
};

const readLegacyExpenses = (storage) => {
  let rawExpenses;
  try {
    rawExpenses = storage.getItem("expenses");
  } catch (error) {
    throw createStorageError("Saved legacy expenses could not be read.", error);
  }
  if (rawExpenses === null) {
    return [];
  }

  let legacyExpenses;
  try {
    legacyExpenses = JSON.parse(rawExpenses);
  } catch (error) {
    throw createStorageError("Saved legacy expenses could not be read.", error);
  }

  if (!Array.isArray(legacyExpenses)) {
    throw new Error("Saved legacy expenses are invalid. No data was changed.");
  }

  const migrationDate = getLocalDateString();
  return legacyExpenses.map((expense, index) => {
    const amountInPaise =
      expense !== null && typeof expense === "object"
        ? parseAmountToPaise(expense.amount)
        : null;
    if (
      expense === null ||
      typeof expense !== "object" ||
      typeof expense.title !== "string" ||
      typeof expense.amount !== "number" ||
      amountInPaise === null
    ) {
      throw new Error(
        `Saved legacy expense ${index + 1} is invalid. No data was changed.`,
      );
    }

    return {
      id: `legacy-${index}`,
      type: "Expense",
      amountInPaise,
      date: migrationDate,
      ...(expense.title.trim() ? { note: expense.title } : {}),
    };
  });
};

const validateStoredEnvelope = (envelope) => {
  if (
    envelope === null ||
    typeof envelope !== "object" ||
    envelope.schemaVersion !== TRANSACTION_SCHEMA_VERSION ||
    !Array.isArray(envelope.transactions) ||
    !envelope.transactions.every(isStoredTransaction)
  ) {
    throw new Error("Saved transactions are invalid. No data was changed.");
  }

  return envelope.transactions;
};

const transactionRepository = {
  load() {
    const storage = readTransactionStorage();
    let rawEnvelope;
    try {
      rawEnvelope = storage.getItem(TRANSACTION_STORAGE_KEY);
    } catch (error) {
      throw createStorageError("Saved transactions could not be read.", error);
    }

    if (rawEnvelope !== null) {
      let envelope;
      try {
        envelope = JSON.parse(rawEnvelope);
      } catch (error) {
        throw createStorageError("Saved transactions are corrupted.", error);
      }

      return validateStoredEnvelope(envelope);
    }

    const migratedTransactions = readLegacyExpenses(storage);
    const envelope = {
      schemaVersion: TRANSACTION_SCHEMA_VERSION,
      transactions: migratedTransactions,
    };

    this.saveEnvelope(storage, envelope);
    return migratedTransactions;
  },

  saveEnvelope(storage, envelope) {
    let serializedEnvelope;
    try {
      serializedEnvelope = JSON.stringify(envelope);
      storage.setItem(TRANSACTION_STORAGE_KEY, serializedEnvelope);
    } catch (error) {
      throw createStorageError(
        "Transactions could not be saved. Please try again.",
        error,
      );
    }
  },

  save(transactions) {
    if (!Array.isArray(transactions) || !transactions.every(isStoredTransaction)) {
      throw new TypeError("Cannot save invalid transactions.");
    }

    const storage = readTransactionStorage();
    this.saveEnvelope(storage, {
      schemaVersion: TRANSACTION_SCHEMA_VERSION,
      transactions,
    });
  },
};

const transactionDateInput = document.getElementById("transaction-date");
if (transactionDateInput) {
  transactionDateInput.value = getLocalDateString();
}

const transactionForm = document.getElementById("transaction-form");
const transactionTypeInput = document.getElementById("transaction-type");
const transactionAmountInput = document.getElementById("transaction-amount");
const transactionNoteInput = document.getElementById("transaction-note");
const transactionHistory = document.getElementById("transaction-history");
const emptyState = document.getElementById("empty-state");
const balanceAmount = document.getElementById("balance-amount");
const saveButton = document.getElementById("save-transaction");
const formError = document.getElementById("form-error");
const saveStatus = document.getElementById("save-status");
const loadError = document.getElementById("load-error");
const retryLoadButton = document.getElementById("retry-load");
const fieldErrorElements = {
  amount: document.getElementById("amount-error"),
  type: document.getElementById("type-error"),
  date: document.getElementById("date-error"),
};
const fieldInputs = {
  amount: transactionAmountInput,
  type: transactionTypeInput,
  date: transactionDateInput,
};

let transactions = [];
let repositoryReady = false;
let isSaving = false;
let isLoading = false;

const showElement = (element, visible) => {
  if (element) {
    element.classList.toggle("hide", !visible);
  }
};

const clearFieldErrors = () => {
  Object.entries(fieldInputs).forEach(([field, input]) => {
    if (input) {
      input.removeAttribute("aria-invalid");
    }
    const errorElement = fieldErrorElements[field];
    if (errorElement) {
      errorElement.textContent = "";
      showElement(errorElement, false);
    }
  });
};

const displayFieldErrors = (errors) => {
  Object.entries(errors).forEach(([field, message]) => {
    const input = fieldInputs[field];
    const errorElement = fieldErrorElements[field];
    if (input) {
      input.setAttribute("aria-invalid", "true");
    }
    if (errorElement) {
      errorElement.textContent = message;
      showElement(errorElement, true);
    }
  });
};

const createTransactionId = (existingTransactions) => {
  const existingIds = new Set(existingTransactions.map(({ id }) => id));
  let cryptoSource;
  try {
    cryptoSource = window.crypto;
  } catch (error) {
    throw new Error("A secure transaction ID could not be created.");
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    let id;
    if (cryptoSource && typeof cryptoSource.randomUUID === "function") {
      id = cryptoSource.randomUUID();
    } else if (cryptoSource && typeof cryptoSource.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      cryptoSource.getRandomValues(bytes);
      id = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    } else {
      throw new Error("Secure transaction IDs are unavailable in this browser.");
    }

    const transactionId = `transaction-${id}`;
    if (!existingIds.has(transactionId)) {
      return transactionId;
    }
  }

  throw new Error("A unique transaction ID could not be created. Please retry.");
};

const createTransactionElement = (transaction) => {
  const item = document.createElement("article");
  item.className = "transaction-item";

  const heading = document.createElement("p");
  heading.className = "transaction-heading";

  const type = document.createElement("span");
  type.textContent = transaction.type;

  const amount = document.createElement("span");
  amount.textContent = formatINR(transaction.amountInPaise);

  const date = document.createElement("p");
  date.className = "transaction-meta";
  date.textContent = formatTransactionDate(transaction.date);

  heading.append(type, amount);
  item.append(heading, date);

  if (typeof transaction.note === "string" && transaction.note.trim()) {
    const note = document.createElement("p");
    note.className = "transaction-note";
    note.textContent = transaction.note;
    item.append(note);
  }

  return item;
};

const renderTransactions = (nextTransactions, balanceInPaise) => {
  const list = document.createElement("div");
  list.className = "transaction-list";
  nextTransactions.forEach((transaction) => {
    list.append(createTransactionElement(transaction));
  });

  transactionHistory.replaceChildren(list);
  balanceAmount.textContent = formatINR(balanceInPaise);
  balanceAmount.hidden = false;
  emptyState.hidden = nextTransactions.length !== 0;
};

const renderLoadFailure = (error) => {
  repositoryReady = false;
  saveButton.disabled = true;
  balanceAmount.hidden = true;
  emptyState.hidden = true;
  transactionHistory.replaceChildren();
  loadError.textContent =
    error instanceof Error
      ? `${error.message} No empty history is being shown.`
      : "Transactions could not be loaded. No empty history is being shown.";
  showElement(loadError, true);
  showElement(retryLoadButton, true);
};

const loadTransactions = () => {
  if (isLoading) {
    return;
  }

  isLoading = true;
  retryLoadButton.disabled = true;
  try {
    const loadedTransactions = transactionRepository.load();
    const loadedBalance = calculateAvailableBalance(loadedTransactions);
    renderTransactions(loadedTransactions, loadedBalance);
    transactions = loadedTransactions;
    repositoryReady = true;
    saveButton.disabled = false;
    showElement(loadError, false);
    showElement(retryLoadButton, false);
  } catch (error) {
    renderLoadFailure(error);
  } finally {
    isLoading = false;
    retryLoadButton.disabled = false;
  }
};

const setFormError = (message) => {
  formError.textContent = message;
  showElement(formError, Boolean(message));
};

const clearSubmissionFeedback = () => {
  setFormError("");
  saveStatus.textContent = "";
  showElement(saveStatus, false);
};

if (transactionForm) {
  transactionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (isSaving || isLoading || !repositoryReady) {
      return;
    }

    clearFieldErrors();
    clearSubmissionFeedback();

    const input = {
      amount: transactionAmountInput.value,
      type: transactionTypeInput.value,
      date: transactionDateInput.value,
    };
    const validation = validateTransaction(input);
    if (!validation.isValid) {
      displayFieldErrors(validation.errors);
      return;
    }

    const note = transactionNoteInput.value.trim();
    let transaction;
    let updatedTransactions;
    let updatedBalance;
    try {
      transaction = {
        id: createTransactionId(transactions),
        type: input.type,
        amountInPaise: validation.amountInPaise,
        date: input.date,
        ...(note ? { note } : {}),
      };
      updatedTransactions = [...transactions, transaction];
      updatedBalance = calculateAvailableBalance(updatedTransactions);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "The transaction could not be prepared. Please retry.",
      );
      return;
    }

    isSaving = true;
    saveButton.disabled = true;
    try {
      try {
        transactionRepository.save(updatedTransactions);
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : "Transactions could not be saved. Please try again.",
        );
        return;
      }

      transactions = updatedTransactions;
      transactionForm.reset();
      transactionDateInput.value = getLocalDateString();
      try {
        renderTransactions(transactions, updatedBalance);
        saveStatus.textContent = "Transaction added.";
        showElement(saveStatus, true);
      } catch (error) {
        setFormError(
          "The transaction was saved, but the history could not refresh. Reload the page to view it.",
        );
      }
    } finally {
      isSaving = false;
      saveButton.disabled = !repositoryReady;
    }
  });
}

if (retryLoadButton) {
  retryLoadButton.addEventListener("click", loadTransactions);
}

loadTransactions();
