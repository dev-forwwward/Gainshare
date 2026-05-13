export function works() {
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