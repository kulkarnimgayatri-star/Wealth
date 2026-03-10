import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import config

def send_budget_exceeded_notification(category, amount, limit, recipient_email):
    """
    Sends an email notification when a category's budget is exceeded.
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = config.MAIL_USERNAME
        msg['To'] = recipient_email
        msg['Subject'] = f"Budget Alert: {category} Limit Exceeded"

        body = f"""
        Hello,

        This is an automated alert from Money Pilot.
        
        You have exceeded your budget for the category: {category}.
        
        Current Spending: ${amount:.2f}
        Budget Limit: ${limit:.2f}
        
        Please review your recent transactions and manage your spending accordingly.

        Best regards,
        Money Pilot Team
        """
        
        msg.attach(MIMEText(body, 'plain'))

        # Connect to server and send email
        server = smtplib.SMTP(config.MAIL_SERVER, config.MAIL_PORT)
        if config.MAIL_USE_TLS:
            server.starttls()
            
        server.login(config.MAIL_USERNAME, config.MAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(config.MAIL_USERNAME, recipient_email, text)
        server.quit()
        
        print(f"Email notification sent successfully to {recipient_email} for category: {category}")
        return True
    except Exception as e:
        print(f"Failed to send email notification: {e}")
        return False
