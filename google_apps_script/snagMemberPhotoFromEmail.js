function snagMemeberPhotosFromGmail() {
  const labelName = "MemberPhoto"; // Gmail label name
  const folderName = "member_photos"; // Google Drive folder name

  // Ensure the "member_photos" folder exists in My Drive, or create it
  const folder = DriveApp.getFoldersByName(folderName).hasNext()
    ? DriveApp.getFoldersByName(folderName).next()
    : DriveApp.createFolder(folderName);

  // Log the folder URL for confirmation
  Logger.log("Using folder: " + folder.getUrl());

  // Get emails with the specific label
  const label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    Logger.log("Label not found: " + labelName);
    return;
  }

  const threads = label.getThreads();
  Logger.log("Threads found with label '" + labelName + "': " + threads.length);

  threads.forEach((thread) => {
    const messages = thread.getMessages();
    Logger.log("Processing thread with " + messages.length + " messages");

    messages.forEach((message) => {
      const attachments = message.getAttachments();
      const senderEmail = message.getFrom().match(/<([^>]+)>/)?.[1] || message.getFrom(); // Handle cases without angle brackets

      Logger.log("Sender: " + senderEmail);
      Logger.log("Attachments found: " + attachments.length);

      attachments.forEach((attachment) => {
        if (attachment.getContentType().includes("image")) {
          // Remove domain suffix from the sender email
          const baseEmail = senderEmail.split("@")[0]; // Extract part before '@'
          const cleanedEmail = baseEmail.replace(/\.[^.\s]+$/, ""); // Remove suffix after the last '.'

          const fileName = `${cleanedEmail}.jpg`; // Adjust extension if necessary
          
          // Check for existing file
          const existingFiles = folder.getFilesByName(fileName);
          if (existingFiles.hasNext()) {
            Logger.log("File already exists, skipping: " + fileName);
          } else {
            const file = folder.createFile(attachment.copyBlob());
            file.setName(fileName);
            Logger.log("Uploaded file: " + fileName);
          }
        }
      });

      // Mark the message as read to prevent reprocessing
      message.markRead();
    });

    // Optionally, remove the label from processed threads
    //thread.removeLabel(label);
  });
}
