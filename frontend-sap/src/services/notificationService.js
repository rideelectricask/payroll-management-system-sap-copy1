const createNotificationModal = (type, title, message, duration = 8000) => {
  const modal = document.createElement('div');
  modal.className = 'fixed top-4 right-4 z-50 animate-slide-in';

  const borderColor = type === 'success' ? 'border-green-500' : 
                     type === 'error' ? 'border-red-500' :
                     type === 'warning' ? 'border-amber-500' : 'border-blue-500';

  const iconColor = type === 'success' ? 'text-green-500' :
                   type === 'error' ? 'text-red-500' :
                   type === 'warning' ? 'text-amber-500' : 'text-blue-500';

  const titleColor = type === 'success' ? 'text-green-800' :
                    type === 'error' ? 'text-red-800' :
                    type === 'warning' ? 'text-amber-800' : 'text-blue-800';

  const icon = type === 'success' ? '✅' :
              type === 'error' ? '⚠️' :
              type === 'warning' ? '⚠️' : 'ℹ️';

  modal.innerHTML = `
    <div class="bg-white border-l-4 ${borderColor} shadow-lg rounded-lg p-4 max-w-md">
      <div class="flex items-start gap-3">
        <div class="${iconColor} text-xl">${icon}</div>
        <div class="flex-1">
          <h3 class="text-sm font-semibold ${titleColor} mb-1">${title}</h3>
          <div class="text-xs text-gray-700 max-h-32 overflow-y-auto whitespace-pre-line">${message}</div>
        </div>
        <button class="text-gray-400 hover:text-gray-600 text-lg leading-none" onclick="this.closest('.fixed').remove()">×</button>
      </div>
    </div>
  `;

  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .animate-slide-in { animation: slide-in 0.3s ease-out; }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(modal);
  setTimeout(() => modal.remove(), duration);
};

export const showSuccessNotification = (title, message) => {
  createNotificationModal('success', title, message);
};

export const showErrorNotification = (title, message) => {
  createNotificationModal('error', title, message);
};

export const showWarningNotification = (title, message) => {
  createNotificationModal('warning', title, message);
};

export const showInfoNotification = (title, message) => {
  createNotificationModal('info', title, message);
};

export const displayDetailedError = (errorMessage, customTitle = "Error") => {
  const lines = errorMessage.split('\n');
  
  if (lines.length <= 1) {
    showErrorNotification(customTitle, errorMessage);
    return;
  }

  const summaryLine = lines[0];
  const remainingLines = lines.slice(1);

  let title = customTitle;
  let formattedMessage = summaryLine;

  if (summaryLine.includes("duplikasi")) {
    title = "Duplikasi Data Ditemukan";
    const duplicateMatch = summaryLine.match(/(\d+) duplikasi/);
    if (duplicateMatch) {
      const [, duplicateCount] = duplicateMatch;
      formattedMessage = `🔍 Ringkasan:\n• ${duplicateCount} data duplikat ditemukan\n• Perbaiki duplikasi ini sebelum melanjutkan\n\n`;
    }
  }

  if (remainingLines.length > 0) {
    formattedMessage += remainingLines.join('\n');
  }

  showErrorNotification(title, formattedMessage);
};

export const displayUploadResult = (result, action = "Upload") => {
  const { summary } = result;

  let title = `${action} Berhasil`;
  let message = `${result.message}\n\n`;

  if (summary) {
    message += `📊 Ringkasan:\n`;
    message += `• Total diproses: ${summary.totalRecords || result.totalRecords || 0}\n`;
    if (summary.insertedRecords !== undefined) {
      message += `• Data baru: ${summary.insertedRecords}\n`;
    }
    if (summary.updatedRecords !== undefined) {
      message += `• Data diperbarui: ${summary.updatedRecords}\n`;
    }
    if (summary.databaseTotal !== undefined) {
      message += `• Total di database: ${summary.databaseTotal}\n`;
    }
  }

  showSuccessNotification(title, message);
};

export const displayDeleteResult = (count, isBulk = false) => {
  const title = isBulk ? "Hapus Batch Berhasil" : "Hapus Data Berhasil";
  const message = isBulk ? 
    `${count} data berhasil dihapus dari database` :
    "Data berhasil dihapus dari database";
  
  showSuccessNotification(title, message);
};

export const displayUpdateResult = (itemName) => {
  const title = "Update Data Berhasil";
  const message = `Data "${itemName}" berhasil diperbarui`;
  
  showSuccessNotification(title, message);
};