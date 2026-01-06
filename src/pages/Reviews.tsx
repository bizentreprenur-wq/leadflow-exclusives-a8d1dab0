import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  User,
  CheckCircle2,
  Quote,
  TrendingUp,
  Heart,
  Sparkles,
} from "lucide-react";

interface Review {
  id: string;
  name: string;
  company?: string;
  rating: number;
  type: "review" | "feedback";
  content: string;
  date: string;
  helpful: number;
  verified: boolean;
}

// Demo reviews
const demoReviews: Review[] = [
  {
    id: "1",
    name: "Sarah M.",
    company: "Digital Marketing Agency",
    rating: 5,
    type: "review",
    content: "BamLead has transformed how we find clients. The AI verification saves us hours every week. Highly recommend!",
    date: "2 days ago",
    helpful: 24,
    verified: true,
  },
  {
    id: "2",
    name: "Michael R.",
    company: "Web Design Studio",
    rating: 5,
    type: "review",
    content: "The email templates are amazing. I've closed 3 new clients in my first month. The ROI is incredible.",
    date: "1 week ago",
    helpful: 18,
    verified: true,
  },
  {
    id: "3",
    name: "Jessica L.",
    company: "Freelancer",
    rating: 4,
    type: "review",
    content: "Great tool for finding leads. Would love to see more integrations in the future. Customer support is top-notch!",
    date: "2 weeks ago",
    helpful: 12,
    verified: true,
  },
  {
    id: "4",
    name: "David K.",
    company: "SaaS Startup",
    rating: 5,
    type: "review",
    content: "We've tried many lead gen tools. BamLead is by far the most user-friendly. Even our junior team members can use it.",
    date: "3 weeks ago",
    helpful: 31,
    verified: true,
  },
];

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>(demoReviews);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"review" | "feedback">("review");
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    rating: 5,
    content: "",
  });
  const [helpfulClicked, setHelpfulClicked] = useState<Set<string>>(new Set());

  const handleSubmit = () => {
    if (!formData.name || !formData.content) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newReview: Review = {
      id: Date.now().toString(),
      name: formData.name,
      company: formData.company || undefined,
      rating: formType === "review" ? formData.rating : 0,
      type: formType,
      content: formData.content,
      date: "Just now",
      helpful: 0,
      verified: false,
    };

    setReviews([newReview, ...reviews]);
    setFormData({ name: "", company: "", rating: 5, content: "" });
    setShowForm(false);
    toast.success(formType === "review" ? "Thank you for your review! 🎉" : "Feedback submitted. We appreciate it!");
  };

  const handleHelpful = (reviewId: string) => {
    if (helpfulClicked.has(reviewId)) return;
    
    setReviews(reviews.map(r => 
      r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r
    ));
    setHelpfulClicked(new Set([...helpfulClicked, reviewId]));
    toast.success("Thanks for your feedback!");
  };

  const avgRating = reviews.filter(r => r.type === "review").reduce((sum, r) => sum + r.rating, 0) / 
    reviews.filter(r => r.type === "review").length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-hero">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-6 gap-1">
                <MessageSquare className="w-3 h-3" />
                Customer Reviews
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
                What Our Customers Say
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Real feedback from real users. We love hearing from you!
              </p>

              {/* Rating Summary */}
              <div className="inline-flex items-center gap-4 p-6 rounded-2xl bg-card border border-border">
                <div className="text-center">
                  <p className="text-4xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
                  <div className="flex gap-1 justify-center mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(avgRating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reviews.filter(r => r.type === "review").length} reviews
                  </p>
                </div>
                <div className="w-px h-16 bg-border" />
                <div className="text-left space-y-1">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviews.filter(r => r.type === "review" && r.rating === rating).length;
                    const percent = (count / reviews.filter(r => r.type === "review").length) * 100 || 0;
                    return (
                      <div key={rating} className="flex items-center gap-2 text-sm">
                        <span className="w-3">{rating}</span>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-400 rounded-full" 
                            style={{ width: `${percent}%` }} 
                          />
                        </div>
                        <span className="text-muted-foreground w-8">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="py-8 border-b border-border">
          <div className="container px-4">
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                className="gap-2"
                onClick={() => {
                  setFormType("review");
                  setShowForm(true);
                }}
              >
                <Star className="w-4 h-4" />
                Write a Review
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setFormType("feedback");
                  setShowForm(true);
                }}
              >
                <MessageSquare className="w-4 h-4" />
                Share Feedback
              </Button>
            </div>
          </div>
        </section>

        {/* Review Form */}
        {showForm && (
          <section className="py-8 bg-secondary/30">
            <div className="container px-4">
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {formType === "review" ? (
                      <><Star className="w-5 h-5 text-amber-400" /> Write Your Review</>
                    ) : (
                      <><MessageSquare className="w-5 h-5 text-primary" /> Share Your Feedback</>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {formType === "review" 
                      ? "Help others by sharing your experience" 
                      : "Tell us what you like or what we can improve"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Your Name *</label>
                      <Input
                        placeholder="John D."
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Company (optional)</label>
                      <Input
                        placeholder="Acme Inc."
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      />
                    </div>
                  </div>

                  {formType === "review" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Rating *</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFormData({ ...formData, rating: star })}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                star <= formData.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {formType === "review" ? "Your Review *" : "Your Feedback *"}
                    </label>
                    <Textarea
                      placeholder={formType === "review" 
                        ? "Tell us about your experience with BamLead..." 
                        : "What do you like? What can we improve?"
                      }
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} className="flex-1 gap-2">
                      <Send className="w-4 h-4" />
                      Submit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Reviews List */}
        <section className="py-16 md:py-24">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto space-y-6">
              {reviews.map((review) => (
                <Card key={review.id} className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{review.name}</span>
                          {review.company && (
                            <span className="text-sm text-muted-foreground">• {review.company}</span>
                          )}
                          {review.verified && (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </Badge>
                          )}
                        </div>

                        {review.type === "review" && (
                          <div className="flex gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        <div className="mt-3 relative">
                          <Quote className="absolute -top-1 -left-2 w-6 h-6 text-muted-foreground/20" />
                          <p className="text-foreground pl-4">{review.content}</p>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                          <span className="text-sm text-muted-foreground">{review.date}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-2 ${helpfulClicked.has(review.id) ? "text-success" : ""}`}
                            onClick={() => handleHelpful(review.id)}
                            disabled={helpfulClicked.has(review.id)}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            Helpful ({review.helpful})
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 bg-gradient-hero">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-6" />
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Try BamLead?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of happy customers who are growing their business with BamLead.
              </p>
              <Button size="lg" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Start Free Trial
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
