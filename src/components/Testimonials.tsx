import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Peter Kamau",
    business: "Kamau's Supermarket, Nairobi",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Peter",
    rating: 5,
    text: "MolabsPOS has transformed how we run our supermarket. The M-PESA integration is seamless, and the offline mode saved us during power outages. Our checkout times have reduced by 60%!",
  },
  {
    name: "Sarah Wanjiku",
    business: "Wanjiku Pharmacy, Kiambu",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    rating: 5,
    text: "The inventory tracking with expiry dates is a game-changer for my pharmacy. I no longer worry about expired stock. The system is so easy to use, even my new staff learned it in a day.",
  },
  {
    name: "James Omondi",
    business: "Omondi's Hardware, Kisumu",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    rating: 5,
    text: "Best investment we made! The reports help me understand my business better. I can see what's selling and what's not. Plus, the support team is always available on WhatsApp.",
  },
  {
    name: "Grace Njeri",
    business: "Njeri's Boutique, Nakuru",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Grace",
    rating: 5,
    text: "I love the loyalty program feature. My customers can now earn points, and they keep coming back! The mobile-friendly interface means I can check my business from anywhere.",
  },
  {
    name: "David Kipchoge",
    business: "Kipchoge Wholesalers, Eldoret",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    rating: 5,
    text: "Managing 3 branches was chaotic before MolabsPOS. Now I can see real-time sales from all locations. The SMS alerts for low stock keep my shelves full. Highly recommended!",
  },
  {
    name: "Mary Akinyi",
    business: "Akinyi General Store, Mombasa",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mary",
    rating: 5,
    text: "The VAT reporting feature makes KRA compliance so easy. No more manual calculations! The price is fair, and the value I get is incredible. This POS pays for itself.",
  },
];

export const Testimonials = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by Kenyan Retailers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join hundreds of successful businesses already using MolabsPOS to grow their sales and streamline operations.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 shadow-soft border border-border hover:shadow-medium transition-shadow"
            >
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="font-semibold">{testimonial.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.business}
                  </p>
                </div>
              </div>

              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-primary text-primary"
                  />
                ))}
              </div>

              <p className="text-muted-foreground">{testimonial.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
