import { ContactForm } from "@/components/contact-form"
import { Mail, MessageSquare, Send } from "lucide-react"

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="mx-auto max-w-4xl">
          {/* Header Section */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
              Get in touch
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed text-pretty">
              Have a question or want to work together? Fill out the form below and we'll get back to you as soon as
              possible.
            </p>
          </div>

          {/* Contact Form Card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8 lg:p-10">
            <ContactForm />
          </div>

          {/* Additional Contact Info */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center rounded-lg border border-border bg-card p-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <Mail className="h-6 w-6 text-accent" aria-hidden="true" />
              </div>
              <h3 className="mb-2 font-semibold text-card-foreground">Email</h3>
              <p className="text-sm text-muted-foreground">hello@example.com</p>
            </div>

            <div className="flex flex-col items-center rounded-lg border border-border bg-card p-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <MessageSquare className="h-6 w-6 text-accent" aria-hidden="true" />
              </div>
              <h3 className="mb-2 font-semibold text-card-foreground">Response Time</h3>
              <p className="text-sm text-muted-foreground">Within 24-48 hours</p>
            </div>

            <div className="flex flex-col items-center rounded-lg border border-border bg-card p-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <Send className="h-6 w-6 text-accent" aria-hidden="true" />
              </div>
              <h3 className="mb-2 font-semibold text-card-foreground">Quick Reply</h3>
              <p className="text-sm text-muted-foreground">We read every message</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
