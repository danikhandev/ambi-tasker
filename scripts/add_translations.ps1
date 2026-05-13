$enPath = "d:/FYP/15-jan-2026/ambi-tasker/localization/en.json"
$urPath = "d:/FYP/15-jan-2026/ambi-tasker/localization/ur.json"

function Add-Translations($path, $key, $translations) {
    $json = Get-Content $path -Raw | ConvertFrom-Json
    $json | Add-Member -MemberType NoteProperty -Name $key -Value $translations -Force
    $json | ConvertTo-Json -Depth 100 | Set-Content $path -Encoding UTF8
}

$enTranslations = @{
    title = "My Services"
    subtitle = "Submit new services for admin approval"
    addNew = "Add New Service"
    addTitle = "Add New Service"
    addSubtitle = "Create a professional listing to start receiving clients."
    steps = @{
        info = "Service Info"
        pricing = "Pricing & Coverage"
        availability = "Availability"
        portfolio = "Portfolio"
    }
    form = @{
        name = "Service Name"
        category = "Category"
        description = "Description"
        priceMin = "Min Price"
        priceMax = "Max Price"
        experience = "Experience"
        location = "Service Location"
        coverage = "Coverage Area"
        days = "Available Days"
        startTime = "Start Time"
        endTime = "End Time"
        images = "Service Images"
        submit = "Submit for Approval"
    }
    status = @{
        pending = "Pending Review"
        approved = "Approved"
        rejected = "Rejected"
        awaiting = "Awaiting admin review"
        active = "Active Service"
        editResubmit = "Edit & Resubmit"
    }
    success = @{
        title = "Submitted!"
        message = "Your service request has been submitted for review. Admin typically approves requests within 24-48 hours."
        back = "Back to My Services"
    }
}

$urTranslations = @{
    title = "میری خدمات"
    subtitle = "ایڈمن کی منظوری کے لیے نئی خدمات جمع کروائیں"
    addNew = "نئی سروس شامل کریں"
    addTitle = "نئی سروس شامل کریں"
    addSubtitle = "کلائنٹس حاصل کرنا شروع کرنے کے لیے ایک پیشہ ور فہرست بنائیں۔"
    steps = @{
        info = "سروس کی معلومات"
        pricing = "قیمت اور کوریج"
        availability = "دستیابی"
        portfolio = "پورٹ فولیو"
    }
    form = @{
        name = "سروس کا نام"
        category = "قسم"
        description = "تفصیل"
        priceMin = "کم از کم قیمت"
        priceMax = "زیادہ سے زیادہ قیمت"
        experience = "تجربہ"
        location = "سروس کا مقام"
        coverage = "کوریج ایریا"
        days = "دستیاب دن"
        startTime = "شروع ہونے کا وقت"
        endTime = "ختم ہونے کا وقت"
        images = "سروس کی تصاویر"
        submit = "منظوری کے لیے جمع کروائیں"
    }
    status = @{
        pending = "زیرِ غور"
        approved = "منظور شدہ"
        rejected = "مسترد شدہ"
        awaiting = "ایڈمن کے جائزے کا انتظار ہے"
        active = "فعال سروس"
        editResubmit = "ترمیم کریں اور دوبارہ جمع کروائیں"
    }
    success = @{
        title = "جمع کروا دیا گیا!"
        message = "آپ کی سروس کی درخواست جائزے کے لیے جمع کر دی گئی ہے۔ ایڈمن عام طور پر 24-48 گھنٹوں کے اندر درخواستوں کی منظوری دیتا ہے۔"
        back = "میری خدمات پر واپس جائیں"
    }
}

Add-Translations $enPath "providerServices" $enTranslations
Add-Translations $urPath "providerServices" $urTranslations
