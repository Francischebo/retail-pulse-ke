import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is MolabsPOS and who is it for?",
    answer: "MolabsPOS is a complete Point of Sale system designed specifically for Kenyan retailers, supermarkets, pharmacies, and wholesalers. It's perfect for businesses of all sizes - from small retail shops to large supermarket chains - that want to modernize their operations with M-PESA integration, inventory tracking, and reliable offline functionality.",
  },
  {
    question: "How does M-PESA integration work?",
    answer: "Our system seamlessly integrates with M-PESA through the official Safaricom API. Customers can pay directly through M-PESA STK Push, and payments are automatically recorded in your system. We also support Airtel Money, card payments via Pesapal, and cash transactions - all tracked in real-time with detailed payment method reports.",
  },
  {
    question: "What happens if my internet goes down?",
    answer: "MolabsPOS features powerful offline-first functionality. You can continue processing sales, printing receipts, and managing inventory without internet. All data is securely stored locally and automatically syncs to the cloud once your connection is restored. Never lose a sale due to connectivity issues!",
  },
  {
    question: "What packages do you offer and what's included?",
    answer: "We offer three main packages: BASIC POS (KES 25,000) - perfect for small shops with 1 terminal, basic inventory, and sales reports; PROFESSIONAL POS (KES 45,000) - our most popular, includes up to 3 terminals, M-PESA integration, loyalty programs, and 3 months support; ENTERPRISE POS (from KES 100,000) - for large operations with unlimited terminals, custom features, and priority support. All packages include lifetime software license, training, and KRA-compliant receipts.",
  },
  {
    question: "Is the system KRA compliant for VAT reporting?",
    answer: "Absolutely! MolabsPOS generates KRA-compliant receipts and provides comprehensive VAT reports. You can filter reports by any date range (daily, weekly, monthly, yearly) and export them as PDF for submission. Our system automatically tracks VATable sales and calculates the 16% VAT, making tax compliance effortless.",
  },
  {
    question: "How does inventory management work?",
    answer: "Our inventory system tracks products with batch numbers, expiry dates (with FIFO selling), and automatic low-stock alerts via SMS to suppliers. You can create purchase orders, manage Goods Received Notes, and track stock levels in real-time. The system prevents selling expired items and helps you maintain optimal stock levels.",
  },
  {
    question: "Can I manage multiple branches or terminals?",
    answer: "Yes! Professional and Enterprise packages support multiple terminals and locations. You get a centralized dashboard where you can view real-time sales from all branches, track inventory across locations, and manage employee access with role-based permissions (Cashier, Supervisor, Manager, Admin).",
  },
  {
    question: "What kind of reports can I generate?",
    answer: "MolabsPOS offers comprehensive reporting with intuitive date range selectors. Generate Sales Summary Reports (revenue, transactions, averages), Payment Method Breakdowns (Cash, M-PESA, Cards), Product Performance (top/worst sellers), Category Analysis, Inventory Reports, and VAT Summaries. All reports can be exported to PDF or Excel for further analysis.",
  },
  {
    question: "Do you provide training and support?",
    answer: "Yes! Every package includes comprehensive training (1-2 hours depending on package). We provide training videos, documentation, and WhatsApp support. Our support team is available Mon-Sat, 8AM-8PM EAT. Professional packages include 3 months support, Enterprise includes 6 months. We also offer extended support contracts.",
  },
  {
    question: "What about hardware? Do I need special equipment?",
    answer: "MolabsPOS works with standard retail hardware. You'll need a computer/tablet, receipt printer, and optionally a barcode scanner. We can recommend trusted suppliers and compatible equipment. The software license is separate from hardware, giving you flexibility to choose or upgrade equipment as needed.",
  },
  {
    question: "How do payment plans work?",
    answer: "We offer flexible payment options: Full upfront payment (get 5% discount), 50-50 split (50% to start, 50% at launch), or 3 installments (30-30-40). No credit card required for the free 30-day trial. Contact us on WhatsApp (+254 740 411 091) to discuss a payment plan that works for your business.",
  },
  {
    question: "How quickly can you set up the system?",
    answer: "Basic setup takes 3-5 days, Professional 5-7 days, and Enterprise 7-14 days depending on customization. This includes software installation, configuration, data migration, hardware setup, staff training, and testing. We work around your schedule to minimize business disruption.",
  },
  {
    question: "Can I try the system before committing?",
    answer: "Yes! We offer a free 30-day trial with no credit card required. You can also schedule a live demo to see the system in action. Contact us via WhatsApp (+254 740 411 091) or email (molabstechsolutions@gmail.com) to book your demo or start your trial.",
  },
  {
    question: "What makes MolabsPOS different from other POS systems?",
    answer: "MolabsPOS is built specifically for the Kenyan market with features local businesses need: M-PESA-first design, SMS supplier alerts, KRA compliance, offline functionality for power outages, and local WhatsApp support. We understand Kenyan business challenges and our pricing is fair and transparent with no hidden fees.",
  },
];

export const FAQ = () => {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Got questions? We've got answers. Can't find what you're looking for? Contact us on WhatsApp!
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Still have questions? We're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/254740411091"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              Chat on WhatsApp
            </a>
            <a
              href="mailto:molabstechsolutions@gmail.com"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors font-medium"
            >
              Send us an Email
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
