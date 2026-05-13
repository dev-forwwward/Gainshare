export function blogCategories() {
    // Blog Categories Link Redirect
    // redirects blog category filter button to respective category page, e.g. /blog/categories/strategy
    const blogCatFilters = document.querySelectorAll('.cat_filter_item');
    if (blogCatFilters.length > 0) {
        blogCatFilters.forEach(link => {
            link.href += link.getAttribute('slug');

            // update filter button active status on page load
            // (checks URL for reference)
            if(window.location.href.includes(link.getAttribute('slug'))) {
                link.querySelector('.tag').classList.add('filter-active');
            }
        });
    }
}