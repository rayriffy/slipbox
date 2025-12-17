import { html } from "@thai/html";

const runtime = html`<style>
    .slipbox-pages {
      display: flex;
      min-height: calc(100vh - 3rem);
      min-height: calc(100svh - 3rem);
      gap: 1rem;
      transition: transform 0.3s ease-out;
    }
    .slipbox-pages-scroller {
      overflow: hidden;
    }
    .slipbox-page {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      flex: 0 0 100%;
      transition: transform 0.3s ease-out, opacity 0.3s ease-out;
    }
    .slipbox-page-header {
      flex: none;
      border-bottom: 1px solid #656463;
      padding-bottom: 0.5rem;
    }
    .slipbox-page-content {
      flex: none;
      margin-top: auto;
      margin-bottom: auto;
    }
    .slipbox-buttons {
      flex: none;
      display: flex;
      gap: 1rem;
    }
    .slipbox-buttons > * {
      flex: 1 1 0;
    }
    .slipbox-buttons > .btn-outline-secondary {
      flex: none;
    }

    .slipbox-pages-scroller[data-page="1"] .slipbox-pages {
      transform: translateX(0%);
    }
    .slipbox-pages-scroller[data-page="2"] .slipbox-pages {
      transform: translateX(-100%) translateX(-1rem);
    }
    .slipbox-pages-scroller[data-page="3"] .slipbox-pages {
      transform: translateX(-200%) translateX(-2rem);
    }

    .slipbox-pages-scroller[data-page="1"]
      .slipbox-page:not([data-page-number="1"]),
    .slipbox-pages-scroller[data-page="2"]
      .slipbox-page:not([data-page-number="2"]),
    .slipbox-pages-scroller[data-page="3"]
      .slipbox-page:not([data-page-number="3"]) {
      transform: scale(0.5);
      opacity: 0.25;
    }
  </style>
  <script>
    function navigatePage(button, offset = 1) {
      const scroller = button.closest(".slipbox-pages-scroller");
      const currentPage = scroller.dataset.page;
      const nextPage = parseInt(currentPage, 10) + offset;
      scroller.dataset.page = nextPage;
    }
  </script>`;

export const pageScroller = { runtime };
