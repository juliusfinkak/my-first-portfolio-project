document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const header = document.querySelector(".header-section");
    const themeToggle = document.getElementById("toggleBtn");
    const mobileMenuToggle = document.getElementById("mobileMenuToggle");
    const primaryNavigation = document.getElementById("primaryNavigation");
    const projectContent = document.getElementById("projectContent");
    const projectButtons = document.querySelectorAll("[data-project-scroll]");
    const backToTopButton = document.querySelector(".back-to-top");
    const getScrollBehavior = () =>
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth";

    const storedTheme = (() => {
        try {
            return localStorage.getItem("theme");
        } catch {
            return null;
        }
    })();

    const applyTheme = (theme) => {
        const isDark = theme === "dark";
        body.classList.toggle("dark-mode", isDark);
        themeToggle?.setAttribute("aria-pressed", String(isDark));

        if (themeToggle) {
            const icon = themeToggle.querySelector("i");
            if (icon) {
                icon.className = isDark ? "fa-solid fa-moon" : "fa-solid fa-sun";
            }
            themeToggle.setAttribute(
                "aria-label",
                isDark ? "Switch to light mode" : "Switch to dark mode"
            );
        }
    };

    applyTheme(
        storedTheme ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    );

    themeToggle?.addEventListener("click", () => {
        const nextTheme = body.classList.contains("dark-mode") ? "light" : "dark";
        applyTheme(nextTheme);

        try {
            localStorage.setItem("theme", nextTheme);
        } catch {
            // The selected theme will remain active for this page session.
        }
    });

    const setMobileMenuOpen = (isOpen) => {
        if (!mobileMenuToggle || !primaryNavigation) return;

        primaryNavigation.classList.toggle("is-open", isOpen);
        mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
        mobileMenuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );

        const icon = mobileMenuToggle.querySelector("i");
        if (icon) {
            icon.className = isOpen
                ? "fa-solid fa-xmark"
                : "fa-solid fa-bars";
        }
    };

    mobileMenuToggle?.addEventListener("click", () => {
        setMobileMenuOpen(
            mobileMenuToggle.getAttribute("aria-expanded") !== "true"
        );
    });

    primaryNavigation?.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setMobileMenuOpen(false));
    });

    const sectionLinks = Array.from(
        primaryNavigation?.querySelectorAll('a.nav-link[href^="#"]') || []
    );
    const observedSections = sectionLinks
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter((section) => section instanceof Element);

    const setActiveNavigationLink = (sectionId) => {
        sectionLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${sectionId}`;
            link.classList.toggle("active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    };

    if (observedSections.length && "IntersectionObserver" in window) {
        let intersectingSections = new Map();

        const updateActiveSection = () => {
            if (!intersectingSections.size) return;

            const headerHeight = header?.getBoundingClientRect().height || 0;
            const activeSection = Array.from(intersectingSections.entries())
                .filter(([, entry]) => entry.isIntersecting)
                .sort(([, first], [, second]) => {
                    const firstDistance = Math.abs(
                        first.boundingClientRect.top - headerHeight
                    );
                    const secondDistance = Math.abs(
                        second.boundingClientRect.top - headerHeight
                    );

                    if (firstDistance !== secondDistance) {
                        return firstDistance - secondDistance;
                    }

                    return second.intersectionRatio - first.intersectionRatio;
                })[0];

            if (activeSection) {
                setActiveNavigationLink(activeSection[0]);
            }
        };

        const sectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    intersectingSections.set(entry.target.id, entry);
                });
                updateActiveSection();
            },
            {
                rootMargin: "-20% 0px -55% 0px",
                threshold: [0, 0.25, 0.5, 0.75, 1]
            }
        );

        observedSections.forEach((section) => sectionObserver.observe(section));
    }

    document.addEventListener("click", (event) => {
        if (
            !mobileMenuToggle ||
            !primaryNavigation ||
            mobileMenuToggle.getAttribute("aria-expanded") !== "true"
        ) {
            return;
        }

        if (
            event.target instanceof Node &&
            !primaryNavigation.contains(event.target) &&
            !mobileMenuToggle.contains(event.target)
        ) {
            setMobileMenuOpen(false);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (
            event.key !== "Escape" ||
            mobileMenuToggle?.getAttribute("aria-expanded") !== "true"
        ) {
            return;
        }

        setMobileMenuOpen(false);
        mobileMenuToggle.focus();
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            setMobileMenuOpen(false);
        }
    });

    const updateHeader = () => {
        header?.classList.toggle("scrolled", window.scrollY > 16);

        if (backToTopButton) {
            const isVisible = window.scrollY > 500;
            backToTopButton.classList.toggle("is-visible", isVisible);
            backToTopButton.setAttribute("aria-hidden", String(!isVisible));
            backToTopButton.tabIndex = isVisible ? 0 : -1;
        }
    };

    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();

    backToTopButton?.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: getScrollBehavior()
        });
    });

    const copyrightYear = document.getElementById("copyrightYear");
    if (copyrightYear) {
        copyrightYear.textContent = String(new Date().getFullYear());
    }

    const getProjectScrollAmount = () => {
        if (!projectContent) return 0;

        const card = projectContent.querySelector(".project-cards");
        if (!card) return projectContent.clientWidth;

        const styles = window.getComputedStyle(projectContent);
        const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
        return card.getBoundingClientRect().width + gap;
    };

    const updateProjectButtons = () => {
        if (!projectContent) return;

        const maxScroll = projectContent.scrollWidth - projectContent.clientWidth;
        const previousButton = document.querySelector('[data-project-scroll="previous"]');
        const nextButton = document.querySelector('[data-project-scroll="next"]');
        const startOffset =
            Number.parseFloat(window.getComputedStyle(projectContent).paddingLeft) || 0;

        if (previousButton) {
            previousButton.disabled = projectContent.scrollLeft <= startOffset + 1;
        }
        if (nextButton) {
            nextButton.disabled =
                maxScroll <= 1 || projectContent.scrollLeft >= maxScroll - 1;
        }
    };

    projectButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!projectContent) return;

            const direction =
                button.dataset.projectScroll === "next" ? 1 : -1;
            projectContent.scrollBy({
                left: getProjectScrollAmount() * direction,
                behavior: getScrollBehavior()
            });
        });
    });

    if (projectContent) {
        projectContent.addEventListener("scroll", updateProjectButtons, {
            passive: true
        });
        projectContent.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

            event.preventDefault();
            projectContent.scrollBy({
                left:
                    getProjectScrollAmount() *
                    (event.key === "ArrowRight" ? 1 : -1),
                behavior: getScrollBehavior()
            });
        });
        window.addEventListener("resize", updateProjectButtons);
        updateProjectButtons();
    }

    const revealElements = document.querySelectorAll(".reveal");
    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (
        revealElements.length &&
        !prefersReducedMotion &&
        "IntersectionObserver" in window
    ) {
        const revealObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    entry.target.classList.toggle(
                        "is-visible",
                        entry.isIntersecting
                    );
                });
            },
            { rootMargin: "0px 0px -48px 0px", threshold: 0.12 }
        );
        const staggerStep =
            Number.parseFloat(
                window
                    .getComputedStyle(document.documentElement)
                    .getPropertyValue("--reveal-stagger")
            ) || 90;

        document.querySelectorAll(".reveal-stagger").forEach((group) => {
            Array.from(group.children).forEach((item, index) => {
                if (item.classList.contains("reveal")) {
                    item.style.setProperty(
                        "--reveal-delay",
                        `${Math.min(index, 5) * staggerStep}ms`
                    );
                }
            });
        });

        revealElements.forEach((element) => revealObserver.observe(element));
        body.classList.add("reveal-enabled");
    }
});
