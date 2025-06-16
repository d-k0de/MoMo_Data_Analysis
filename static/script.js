document.addEventListener('DOMContentLoaded', () => {
    let allTransactions = [];
    let currentPage = 1;
    let filteredTransactions = [];
    const itemsPerPage = 50;

    // DOM elements
    const detailsView = document.getElementById('detailsView');
    const itemCount = document.getElementById('itemCount');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    const searchInput = document.getElementById('search');
    const typeFilter = document.getElementById('typeFilter');
    const dateFilter = document.getElementById('dateFilter');
    const exportBtn = document.getElementById('exportBtn');
    const exportModal = document.getElementById('exportModal');
    const exportTypeFilter = document.getElementById('exportTypeFilter');
    const exportContext = document.getElementById('exportContext');
    const pageRangeInputs = document.getElementById('pageRangeInputs');
    const entryRangeInputs = document.getElementById('entryRangeInputs');
    const startPageInput = document.getElementById('startPage');
    const endPageInput = document.getElementById('endPage');
    const startEntryInput = document.getElementById('startEntry');
    const endEntryInput = document.getElementById('endEntry');
    const confirmExport = document.getElementById('confirmExport');
    const cancelExport = document.getElementById('cancelExport');
    const closeModal = document.getElementById('closeModal');
    const exportModeRadios = document.querySelectorAll('input[name="exportMode"]');

    // Initial loading state
    detailsView.innerHTML = '<p>Loading...</p>';

    // Fetch data
    fetch('http://127.0.0.1:5000/api/transactions')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            allTransactions = data;
            filteredTransactions = applyFilters(false); 
        })
        .catch(error => {
            console.error('Fetch error:', error);
            detailsView.innerHTML = '<p>Error loading data. Please try again later.</p>';
            itemCount.textContent = '0 items found';
        });

    // Event listeners
    searchInput.addEventListener('input', () => applyFilters(true));
    typeFilter.addEventListener('change', () => applyFilters(true));
    dateFilter.addEventListener('change', () => applyFilters(true));
    prevBtn.addEventListener('click', () => changePage(-1));
    nextBtn.addEventListener('click', () => changePage(1));
    exportBtn.addEventListener('click', () => {
        exportModal.style.display = 'block';
        updateExportContext();
        startPageInput.value = 1;
        endPageInput.value = Math.ceil(filteredTransactions.length / itemsPerPage);
        startEntryInput.value = 1;
        endEntryInput.value = Math.min(filteredTransactions.length, itemsPerPage);
        pageRangeInputs.style.display = 'block';
        entryRangeInputs.style.display = 'none';
        exportModeRadios[0].checked = true; 
    });
    cancelExport.addEventListener('click', () => {
        exportModal.style.display = 'none';
    });
    closeModal.addEventListener('click', () => {
        exportModal.style.display = 'none';
    });
    confirmExport.addEventListener('click', exportToCSV);
    exportTypeFilter.addEventListener('change', updateExportContext);
    exportModeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            pageRangeInputs.style.display = radio.value === 'page' ? 'block' : 'none';
            entryRangeInputs.style.display = radio.value === 'entry' ? 'block' : 'none';
        });
    });

    function applyFilters(resetPage = true) {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedType = typeFilter.value;
        const selectedDate = dateFilter.value;

        filteredTransactions = allTransactions.filter(transaction => {
            const matchesSearch = transaction.type.toLowerCase().includes(searchTerm) ||
                                transaction.description.toLowerCase().includes(searchTerm);
            const matchesType = !selectedType || transaction.type === selectedType;
            const matchesDate = !selectedDate || transaction.date === selectedDate;
            return matchesSearch && matchesType && matchesDate;
        });

        // Sort by date (descending)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (resetPage) {
            currentPage = 1; 
        }
        
        updatePagination();
        renderDetails();
        return filteredTransactions;
    }

    function renderDetails() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedData = filteredTransactions.slice(start, end);

        if (paginatedData.length === 0) {
            detailsView.innerHTML = '<p>No transactions found.</p>';
            itemCount.textContent = '0 items found';
            return;
        }

        let html = '<ul>';
        paginatedData.forEach(transaction => {
            html += `
            <li class="transaction-item" 
                style="cursor: pointer; padding: 10px; border-bottom: 1px solid #eee; position: relative;"
                data-transaction='${JSON.stringify(transaction)}'>
                <strong>${transaction.type}</strong><br>
                Amount: ${transaction.amount} RWF<br>
                <span class="extra-details" style="display: none;">
                    Date: ${transaction.date}<br>
                    ${transaction.sender !== 'Unknown' ? `From: ${transaction.sender}<br>` : ''}
                    ${transaction.receiver !== 'Unknown' ? `To: ${transaction.receiver}<br>` : ''}
                    Description: ${transaction.description || 'N/A'}
                </span>
                <button class="toggle-btn" style="position: absolute; right: 10px; top: 10px; padding: 2px 8px; border: 1px solid #ddd; border-radius: 3px;">+</button>
            </li>`;
        });
        html += '</ul>';
        detailsView.innerHTML = html;

        // Add toggle functionality
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const extraDetails = this.parentElement.querySelector('.extra-details');
                const isVisible = extraDetails.style.display === 'block';
                extraDetails.style.display = isVisible ? 'none' : 'block';
                this.textContent = isVisible ? '+' : '−';
            });
        });

        itemCount.textContent = `${filteredTransactions.length} items found`;
    }

    function changePage(delta) {
        const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
        currentPage = Math.max(1, Math.min(currentPage + delta, totalPages));
        renderDetails();
        updatePagination();
    }

    function updatePagination() {
        const totalItems = filteredTransactions.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);
        
        pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${startItem}-${endItem}/${totalItems} entries)`;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages || totalItems === 0;
        
        console.log(`Page ${currentPage} of ${totalPages}, Showing ${startItem}-${endItem} of ${totalItems} items`);
    }

    function updateExportContext() {
        const selectedType = exportTypeFilter.value;
        let exportTransactions = filteredTransactions;
        if (selectedType) {
            exportTransactions = filteredTransactions.filter(t => t.type === selectedType);
        }
        const totalItems = exportTransactions.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        exportContext.textContent = `Selected: ${selectedType || 'All Types'} (${totalItems} entries, ${totalPages} pages)`;
    }

    // Transaction click handler
    detailsView.addEventListener('click', (e) => {
        const li = e.target.closest('li.transaction-item');
        if (li && !e.target.classList.contains('toggle-btn')) {
            try {
                const transaction = JSON.parse(li.getAttribute('data-transaction'));
                displayDetailedView(transaction);
            } catch (error) {
                console.error('Error parsing transaction:', error);
            }
        }
    });

    function displayDetailedView(transaction) {
        closeDetailedView();
        
        const panel = document.createElement('div');
        panel.id = 'detailedPanel';
        panel.style.cssText = `
            position: fixed; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%); 
            background: white; 
            padding: 20px; 
            border: 1px solid #ccc; 
            z-index: 1000; 
            max-height: 80vh; 
            overflow-y: auto;
            box-shadow: 0 0 20px rgba(0,0,0,0.2);
            border-radius: 5px;
            width: 90%;
            max-width: 600px;
        `;
        
        panel.innerHTML = `
            <h3 style="margin-top: 0; color: #333;">Transaction Details</h3>
            <p><strong>Type:</strong> ${transaction.type}</p>
            <p><strong>Amount:</strong> ${transaction.amount} RWF</p>
            <p><strong>Date:</strong> ${transaction.date}</p>
            <p><strong>Sender:</strong> ${transaction.sender || 'N/A'}</p>
            <p><strong>Receiver:</strong> ${transaction.receiver || 'N/A'}</p>
            <p><strong>Description:</strong> ${transaction.description || 'N/A'}</p>
            <button onclick="closeDetailedView()" 
                    style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 15px;">
                Close
            </button>
        `;
        document.body.appendChild(panel);
    }

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.id !== 'detailedPanel' && !e.target.closest('#detailedPanel') && !e.target.closest('.transaction-item')) {
            closeDetailedView();
        }
    });

    function exportToCSV() {
        const selectedType = exportTypeFilter.value;
        const mode = document.querySelector('input[name="exportMode"]:checked').value;
        let exportTransactions = selectedType
            ? filteredTransactions.filter(t => t.type === selectedType)
            : filteredTransactions;
        const totalItems = exportTransactions.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        let startIndex, endIndex;
        if (mode === 'page') {
            const startPage = parseInt(startPageInput.value) || 1;
            const endPage = parseInt(endPageInput.value) || 1;
            if (isNaN(startPage) || startPage < 1) {
                alert(`Start page must be at least 1.`);
                return;
            }
            if (isNaN(endPage) || endPage < startPage) {
                alert(`End page must be at least ${startPage}.`);
                return;
            }
            if (endPage > totalPages) {
                alert(`End page exceeds total pages (${totalPages}) for ${selectedType || 'All Types'}.`);
                return;
            }
            startIndex = (startPage - 1) * itemsPerPage;
            endIndex = endPage * itemsPerPage;
        } else {
            const startEntry = parseInt(startEntryInput.value) || 1;
            const endEntry = parseInt(endEntryInput.value) || 1;
            if (isNaN(startEntry) || startEntry < 1) {
                alert(`Start entry must be at least 1.`);
                return;
            }
            if (isNaN(endEntry) || endEntry < startEntry) {
                alert(`End entry must be at least ${startEntry}.`);
                return;
            }
            if (endEntry > totalItems) {
                alert(`End entry exceeds total entries (${totalItems}) for ${selectedType || 'All Types'}.`);
                return;
            }
            startIndex = startEntry - 1;
            endIndex = endEntry;
        }

        exportTransactions = exportTransactions.slice(startIndex, endIndex);

        if (exportTransactions.length === 0) {
            alert(`No transactions available to export for ${selectedType || 'All Types'} in the selected range.`);
            return;
        }

        // Create CSV content
        const headers = ['Type', 'Amount', 'Date', 'Sender', 'Receiver', 'Description'];
        const csvRows = [headers.join(',')];
        exportTransactions.forEach(t => {
            const row = [
                `"${t.type.replace(/"/g, '""')}"`,
                t.amount,
                `"${t.date}"`,
                `"${(t.sender || 'N/A').replace(/"/g, '""')}"`,
                `"${(t.receiver || 'N/A').replace(/"/g, '""')}"`,
                `"${(t.description || 'N/A').replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = mode === 'page'
            ? `transactions_page_${startPageInput.value}_to_${endPageInput.value}.csv`
            : `transactions_entry_${startEntryInput.value}_to_${endEntryInput.value}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);

        exportModal.style.display = 'none';
    }

    // Global function to close detailed view
    window.closeDetailedView = function() {
        const panel = document.getElementById('detailedPanel');
        if (panel) panel.remove();
    };
});