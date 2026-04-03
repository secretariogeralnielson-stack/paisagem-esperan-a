const DESTINATION_EMAIL = "secretariogeralnielson2026@gmail.com";

const elements = {
  form: document.getElementById("feedbackForm"),
  name: document.getElementById("feedbackName"),
  email: document.getElementById("feedbackEmail"),
  type: document.getElementById("feedbackType"),
  subject: document.getElementById("feedbackSubject"),
  message: document.getElementById("feedbackMessage"),
  copyButton: document.getElementById("copyFeedbackButton"),
  toast: document.getElementById("toast")
};

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2400);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function buildFeedbackText() {
  return [
    `Nome: ${elements.name.value.trim()}`,
    `E-mail: ${elements.email.value.trim()}`,
    `Tipo: ${elements.type.value}`,
    `Assunto: ${elements.subject.value.trim()}`,
    "",
    "Mensagem:",
    elements.message.value.trim()
  ].join("\n");
}

function validateForm() {
  return elements.form.reportValidity();
}

function openMailClient() {
  const subject = `[${elements.type.value}] ${elements.subject.value.trim()}`;
  const body = buildFeedbackText();
  const mailtoUrl = `mailto:${encodeURIComponent(DESTINATION_EMAIL)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
}

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateForm()) {
    return;
  }

  try {
    await copyText(buildFeedbackText());
    openMailClient();
    showToast("Seu aplicativo de e-mail foi acionado e a mensagem também foi copiada.");
  } catch (error) {
    console.error(error);
    showToast("Não foi possível preparar o envio agora.");
  }
});

elements.copyButton.addEventListener("click", async () => {
  if (!validateForm()) {
    return;
  }

  try {
    await copyText(buildFeedbackText());
    showToast("Mensagem copiada.");
  } catch (error) {
    console.error(error);
    showToast("Não foi possível copiar agora.");
  }
});
