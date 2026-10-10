tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          colors: {
            "brand-bg": "#181614",
            "brand-bar": "#211E1B",
            "brand-card": "#2A2622",
            "brand-border": "#3A342E",
            "brand-text-primary": "#F7F3EC",
            "brand-text-secondary": "#B8B0A6",
            "brand-text-disabled": "#5c534b",
            "brand-red": "#B42318",
            "brand-red-hover": "#9E1C13",
            "brand-red-dark": "#5c0000",
            "brand-red-light": "#ffb4a8",
            "brand-surface-accent": "#342E28",
            "success": "#2E7D32",
            "success-bg": "#1B2E20",
            "warning": "#f59e0b",
            "error": "#ef4444",
          },
          fontFamily: {
            label: [
              "Geist",
              {
                weight: "500",
                letterSpacing: "0.02em",
              }
            ],
            headline: [
              "Newsreader",
              {
                weight: "600",
                letterSpacing: "-0.01em",
              }
            ],
            title: [
              "Geist",
              {
                weight: "600",
                letterSpacing: "-0.01em",
              }
            ],
            body: [
              "Geist",
              {
                weight: "400",
              }
            ],
            price: [
              "Geist",
              {
                weight: "600",
                letterSpacing: "-0.02em",
              }
            ],
          },
          fontSize: {
            label: ["13px", { lineHeight: "18px" }],
            headline: ["24px", { lineHeight: "32px" }],
            title: ["16px", { lineHeight: "24px" }],
            body: ["14px", { lineHeight: "20px" }],
            price: ["18px", { lineHeight: "24px" }],
          },
          spacing: {
            space: {
              xs: "0.25rem",
              sm: "0.5rem",
              md: "1rem",
              lg: "1.5rem",
              xl: "2rem",
              "2xl": "3rem",
              "3xl": "4rem",
            },
            margin: {
              "desktop": "2rem",
            },
          },
          borderRadius: {
            sm: "0.125rem",
            lg: "0.25rem",
            xl: "0.5rem",
            "2xl": "0.75rem",
            full: "9999px",
          },
        },
      },
    }
