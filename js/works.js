export function works() {
    // Work Case Link Redirect (for case links in Homepage and Works)
    const workCaseLinks = document.querySelectorAll('.work_case_link');
    if (workCaseLinks.length > 0) {
        workCaseLinks.forEach(link => {
            link.href += link.getAttribute('slug');
        });
    }

    // filter - active 'all' handler
    const filterBtns = document.querySelectorAll('.filter_item .tag');
    const allFilterBtn = document.querySelector('.filter_item.all_filter');
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                let previousActiveBtn = document.querySelector('.filter_item .tag.filter-active');;
                if (previousActiveBtn) {
                    previousActiveBtn.classList.remove('filter-active');
                }
                btn.classList.add('filter-active');
            });
        });
    }
}