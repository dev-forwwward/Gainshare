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

    // Image Zoom-in with Fancybox
    const articleImgs = document.querySelectorAll('figure img');
    if (articleImgs.length > 0) {
        articleImgs.forEach(img => {
            img.addEventListener('click', () => {
                img.setAttribute('data-fancybox', 'gallery');
            });
        });
    }


    // Make sure all Article links are external
    const articleLinks = document.querySelectorAll('.w-richtext a');
    if (articleLinks.length > 0) {
        articleLinks.forEach(link => {
            if (link.getAttribute('href') && link.getAttribute('href').startsWith('http')) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }
}