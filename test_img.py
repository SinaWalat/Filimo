import urllib.request
url = "https://streamex.sh/api/images/proxy/GwZg7AZpYEZgHCAjAJgCzuAQ1sFKBWWYgE0IUkx3gWAFNp51JQw7gOBOdEFEGYCXogSIRHxgh28bCJBZ6sgMYgVa+cAggIwRKL6dt8qSEMKywFuHZdgBbHkuFgSXEpQdLDGjs6KP9jJgbJqKEEA.webp"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Content-Type:", response.headers.get('Content-Type'))
except Exception as e:
    print("Error:", e)
