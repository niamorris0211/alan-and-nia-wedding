const navLinks = document.querySelectorAll('a[href^="#"]');
const faqButtons = document.querySelectorAll(".faq-question");

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");

    if (!targetId || targetId === "#") {
      return;
    }

    const targetElement = document.querySelector(targetId);

    if (!targetElement) {
      return;
    }

    event.preventDefault();
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
});

faqButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const faqItem = button.closest(".faq-item");
    const answer = faqItem.querySelector(".faq-answer");
    const isOpen = faqItem.classList.contains("is-open");

    faqItem.classList.toggle("is-open", !isOpen);
    button.setAttribute("aria-expanded", String(!isOpen));
    answer.style.maxHeight = !isOpen ? `${answer.scrollHeight}px` : "0px";
  });
});
