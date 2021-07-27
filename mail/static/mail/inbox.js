document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Get the values from the form fields
  document.querySelector("#submit").addEventListener("click", () => {
    recipients = document.querySelector('#compose-recipients').value;
    subject = document.querySelector('#compose-subject').value;
    body = document.querySelector('#compose-body').value;

    // Send POST request to API to send email
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    });
  });
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Send GET request to API
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      
      for (let i = 0; i < emails.length; i++) {
        //use for-loop, get data and create HTML elements for each email; continue to next iteration without creating HTML element if check for archived and sender fail 
        let email_id = emails[i].id;
        let read = emails[i].read;
        let archived = emails[i].archived;
        let sender = emails[i].sender;
        let subject = emails[i].subject;
        let timestamp = emails[i].timestamp;
        let current_user = document.querySelector('h2').innerHTML;

        if (archived === true && mailbox === 'inbox') {
          continue;
        }
        if (sender === current_user && mailbox === 'inbox') {
          continue;
        }
        // Create div element for each email in mailbox
        const email_listing = document.createElement('div');
        email_listing.className = 'email-class';
        email_listing.id = email_id;

        const inside_text = document.createElement('div');
        inside_text.className = 'inside-text';
        email_listing.append(inside_text);

        const email_labels = ['From', 'Subject', 'Sent'];
        const email_elements = [sender, subject, timestamp];

        for (let e = 0; e < email_elements.length; e++) {
          let email_element_div = document.createElement('div');
          let email_element = document.createElement('p');
          let email_label = document.createElement('label');
          
          email_element_div.className = email_labels[e];
          email_label.className = 'email-label';
          email_element.className = 'email-element';
          
          email_element.id = `${email_id}-${email_labels[e]}`
          email_label.htmlFor = email_element.id;
          email_label.innerHTML = `${email_labels[e]}: `;
          email_element.innerHTML = email_elements[e];

          email_element_div.append(email_label, email_element);
          inside_text.append(email_element_div);
        }
        
        // Change color when read
        if (read === true) {
          email_listing.style.backgroundColor = '#c2c7cf';
        }
        
        // Add event handler to click on it
        email_listing.addEventListener('click', function () {
          load_email(email_id);
        });
        
        document.querySelector('#emails-view').append(email_listing);
      }
    });
}

function load_email(id) {
  // Hide emails in the mailbox
  email_listings = document.querySelectorAll('.email-class');
  for (let f = 0; f < email_listings.length; f++) {
    email_listings[f].style.display = 'none';
  }

  // Call API to get specific email details
  fetch(`/emails/${parseInt(id)}`)
    .then(response => response.json())
    .then(email => {
      let sender = email.sender;
      let raw_recipients = email.recipients;

      // This is to format the recipients better for display
      recipients = [raw_recipients[0]];
      for (r = 1; r < raw_recipients.length; r++) {
        raw_recipients[r] = ' ' + raw_recipients[r];
        recipients.push(raw_recipients[r]);
      }

      let subject = email.subject;
      let timestamp = email.timestamp;
      let body = email.body;
      let archived = email.archived;

      // Create email heading and body
      const email_heading = document.createElement('div');
      email_heading.className = 'email-heading';
      email_heading.id = id;

      // Create header elements and append to the div
      const header_elements = [sender, recipients, subject, timestamp];
      const header_labels = ['From', 'To', 'Subject', 'Sent'];

      for (let h = 0; h < header_elements.length; h++) {
        let header_element_div = document.createElement('div');
        let header_label = document.createElement('label');
        let header_element = document.createElement('p');
        
        header_element_div.className = 'header-div';
        header_element.className = 'header-element';
        header_element.id = `header-element-${id}`;
        header_label.className = 'header-label';
        header_label.htmlFor = header_element.id;
        header_label.innerHTML = `${header_labels[h]}:`;
        header_element.innerHTML = header_elements[h];
        
        header_element_div.append(header_label, header_element);
        email_heading.append(header_element_div);
      }

      // Create body element and append to the div
      const email_body = document.createElement('div');
      email_body.className = 'email-body';
      email_body.id = `body-${id}`;

      // Properly display emails that have been replied to
      if (body.includes('_______________________')) {
        br = document.createElement('br');
        body = body.split('_______________________');

        for (b = 0; b < body.length; b++) {
          if (!body[b].includes('wrote:')) {
            email_body.innerHTML += 'On ' + timestamp + ', ' + sender + ' wrote: ' + body[b];
          }
          else {
            email_body.innerHTML += body[b];
          }
          email_body.append(br);
        }
      }
      else {
        email_body.innerHTML = body;
      }

      // If email is not already archived, create button to archive, if archived, say that it is 
      let archive_status = '';
      if (archived === false) {
        archive_status = document.createElement('button');
        archive_status.className = 'btn btn-sm btn-outline-primary';
        archive_status.innerHTML = 'Archive';
        archive_status.addEventListener('click', function () {
          archive_email(id, archive_status.innerHTML)
        });
      }
      else {
        archive_status = document.createElement('button');
        archive_status.className = 'btn btn-sm btn-outline-primary';
        archive_status.innerHTML = 'Unarchive';
        archive_status.addEventListener('click', function () {
          archive_email(id, archive_status.innerHTML)
        });
      }

      // Add button to reply to email
      const reply_btn = document.createElement('button');
      reply_btn.id = 'reply-btn';
      reply_btn.className = 'btn btn-sm btn-outline-primary';
      reply_btn.innerHTML = 'Reply';
      reply_btn.addEventListener('click', function () {
        reply_to_email(id)
      });

      const page_break = document.createElement('hr');

      document.querySelector('#emails-view').append(email_heading, reply_btn, archive_status, page_break, email_body);

    });
  // Mark emails that you clicked on as read
  fetch(`/emails/${parseInt(id)}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });
}

function reply_to_email(id) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';

  // Send GET request to API to get the details of that email
  fetch(`/emails/${parseInt(id)}`)
    .then(response => response.json())
    .then(email => {
      let sender = email.sender;
      let subject = email.subject;
      let timestamp = email.timestamp;
      let body = email.body;

      if (!subject.includes('RE: ')) {
        subject = `RE: ${subject}`;
      }

      document.querySelector('#compose-recipients').value = sender;
      document.querySelector('#compose-subject').value = subject;

      if (!body.includes('_______________________')) {
        document.querySelector('#compose-body').value = 'On ' + timestamp + ', ' + sender + ' wrote:\n' + body + '\n' + '_______________________' + '\n\n';
      }
      else {
        document.querySelector('#compose-body').value = body;
      }
      document.querySelector('#compose-body').autofocus = true;

      document.querySelector('#compose-view').style.display = 'block';

      // Add click event listener to submit button
      document.querySelector("#submit").addEventListener("click", () => {
        recipients = document.querySelector('#compose-recipients').value;
        reply_subject = document.querySelector('#compose-subject').value;
        reply_body = document.querySelector('#compose-body').value;

        // Send POST request to API to send email
        fetch('/emails', {
          method: 'POST',
          body: JSON.stringify({
            recipients: recipients,
            subject: reply_subject,
            body: reply_body
          })
        });
      });
    });
}

function archive_email(id, archive_status) {
  // Send PUT request to API to update the archived value from false to true
  if (archive_status === 'Archive') {
    fetch(`/emails/${parseInt(id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: true
      })
    });
  }
  else {
    fetch(`/emails/${parseInt(id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: false
      })
    });
  }
  // Return user to the inbox
  document.querySelector('#emails-view').style.display = 'none';
  load_mailbox('inbox');
}
