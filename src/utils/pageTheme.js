/* Reset default browser styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Body styling */
body {
  font-family: Arial, Helvetica, sans-serif;
  background-color: transparent;
  color: var(--vg-text);
  line-height: 1.6;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
/* Forms: only stack fields vertically (pages style their own forms) */
form {
  display: flex;
  flex-direction: column;
}

form input {
  margin-bottom: 12px;
}

input, button {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 14px;
}

/* Buttons */
button {
  background-color: var(--vg-accent);
  color: white;
  border: none;
  cursor: pointer;
  transition: background 0.3s ease;
}

button:hover {
  background-color: var(--vg-accent-hover);
}

/* Headings */
h2, h3 {
  margin-bottom: 15px;
  color: var(--vg-accent);
}

/* Lists */
ul {
  list-style: none;
  padding: 0;
}

li {
  background: rgba(255,255,255,0.45);
  margin-bottom: 8px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.7);
}
/* ============================================================
   MOBILE RESPONSIVENESS IMPROVEMENTS
   ============================================================ */

/* Make all images responsive */
img {
  max-width: 100%;
  height: auto;
}

/* Tables scroll horizontally on mobile instead of breaking */
table {
  display: block;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Prevent text from being too small on mobile */
@media (max-width: 768px) {
  body {
    font-size: 15px;
  }

  /* Reduce excessive padding on mobile */
  .container,
  [class*="container"],
  [class*="page"] {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }

  /* Make buttons easier to tap */
  button,
  a {
    -webkit-tap-highlight-color: transparent;
  }

  /* Prevent horizontal scroll */
  html,
  body {
    overflow-x: hidden;
    max-width: 100vw;
  }

  /* Responsive heading sizes */
  h1 {
    font-size: 24px !important;
  }
  h2 {
    font-size: 20px !important;
  }
  h3 {
    font-size: 17px !important;
  }

  /* Toast notifications full width on mobile */
  [class*="toast"] {
    font-size: 13px;
  }

  /* Modal max height */
  [class*="modal"] {
    max-height: 90vh !important;
    padding: 20px !important;
  }

  /* Better form spacing */
  input,
  select,
  textarea {
    font-size: 16px !important; /* Prevents iOS zoom on focus */
  }
}

/* Very small phones (iPhone SE, etc.) */
@media (max-width: 400px) {
  h1 {
    font-size: 22px !important;
  }
  h2 {
    font-size: 18px !important;
  }
}


/* Better focus states for accessibility */
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--vg-accent);
  outline-offset: 2px;
  }
