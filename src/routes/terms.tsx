import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms & Conditions — activoo" },
      { name: "description", content: "Read the terms and conditions for using activoo." },
      { property: "og:title", content: "Terms & Conditions — activoo" },
      { property: "og:description", content: "Read the terms and conditions for using activoo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function TermsPage() {
  const { lang } = useI18n();
  const isEn = lang === "en";

  return (
    <AppShell hideViewTabs>
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← {isEn ? "Back to home" : "მთავარზე დაბრუნება"}
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">
          {isEn ? "Terms & Conditions" : "წესები და პირობები"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isEn ? "Last updated: " : "ბოლო განახლება: "} {new Date().toLocaleDateString(isEn ? "en-US" : "ka-GE", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="mt-10 space-y-8 text-foreground/90">
          {isEn ? (
            <>
              <section>
                <h2 className="text-xl font-semibold">1. Introduction</h2>
                <p className="mt-2 leading-relaxed">
                  Welcome to activoo. These Terms & Conditions govern your use of our website and services. By accessing or using activoo, you agree to be bound by these terms. If you do not agree, please do not use our platform.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">2. Services</h2>
                <p className="mt-2 leading-relaxed">
                  activoo is a discovery platform that connects parents with extracurricular classes, schools, and activities for children. We do not directly provide these classes; we facilitate the connection between users and third-party schools or instructors.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">3. User Accounts</h2>
                <p className="mt-2 leading-relaxed">
                  To access certain features, you may need to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You must provide accurate and complete information.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">4. School and Class Listings</h2>
                <p className="mt-2 leading-relaxed">
                  Schools and instructors are responsible for the accuracy of their listings, including descriptions, schedules, prices, and contact details. activoo reserves the right to review, moderate, or remove content that violates our policies.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">5. Reviews and Content</h2>
                <p className="mt-2 leading-relaxed">
                  Users may submit reviews and other content. You retain ownership of your content, but grant activoo a license to display it. You may not post false, defamatory, abusive, or illegal content.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">6. Privacy</h2>
                <p className="mt-2 leading-relaxed">
                  Your privacy is important to us. Please review our{" "}
                  <Link to="/privacy" className="text-primary underline underline-offset-2">Privacy Policy</Link>{" "}
                  to understand how we collect, use, and protect your personal information.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">7. Limitation of Liability</h2>
                <p className="mt-2 leading-relaxed">
                  activoo is not liable for any disputes, damages, or losses arising from interactions between users and schools. We do not guarantee the quality, safety, or suitability of any class or school listed on the platform.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">8. Changes to Terms</h2>
                <p className="mt-2 leading-relaxed">
                  We may update these Terms & Conditions from time to time. Continued use of the platform after changes constitutes acceptance of the revised terms.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">9. Contact</h2>
                <p className="mt-2 leading-relaxed">
                  If you have any questions about these Terms & Conditions, please contact us at{" "}
                  <a href="mailto:support@activoo.ge" className="text-primary underline underline-offset-2">support@activoo.ge</a>.
                </p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-xl font-semibold">1. შესავალი</h2>
                <p className="mt-2 leading-relaxed">
                  მოგესალმებით activoo-ზე. ეს წესები და პირობები რეგულირებს ჩვენი ვებსაიტისა და სერვისების გამოყენებას. activoo-ზე წვდომის ან მისი გამოყენების შემთხვევაში, თქვენ ეთანხმებით ამ პირობებს. თუ არ ეთანხმებით, გთხოვთ, არ გამოიყენოთ ჩვენი პლატფორმა.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">2. სერვისები</h2>
                <p className="mt-2 leading-relaxed">
                  activoo არის აღმოჩენის პლატფორმა, რომელიც აკავშირებს მშობლებს ბავშვებისთვის განკუთვნილ საგანმანათლებლო, სპორტულ და შემეცნებითი წრეების, სკოლებისა და აქტივობების ძიებისას. ჩვენ პირდაპირ არ ვაწარმოებთ ამ წრეებს; ჩვენ ვუზრუნველყოფთ კავშირს მომხმარებლებსა და მესამე მხარის სკოლებს ან ინსტრუქტორებს შორის.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">3. მომხმარებლის ანგარიშები</h2>
                <p className="mt-2 leading-relaxed">
                  გარკვეული ფუნქციების გამოსაყენებლად შესაძლოა დაგჭირდეთ ანგარიშის შექმნა. თქვენ ხართ პასუხისმგებელი თქვენი ანგარიშის ინფორმაციის კონფიდენციალურობის შენარჩუნებაზე და ყველა ქმედებაზე, რომელიც თქვენი ანგარიშის ქვეშ ხდება. თქვენ უნდა მოგვაწოდოთ ზუსტი და სრული ინფორმაცია.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">4. სკოლებისა და წრეების განცხადებები</h2>
                <p className="mt-2 leading-relaxed">
                  სკოლები და ინსტრუქტორები არიან პასუხისმგებელნი მათი განცხადებების სიზუსტეზე, მათ შორის აღწერილობების, განრიგის, ფასებისა და საკონტაქტო ინფორმაციის. activoo იტოვებს უფლებას, გადაამოწმოს, დაამოდერიროს ან წაშალოს კონტენტი, რომელიც არღვევს ჩვენს პოლიტიკას.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">5. მიმოხილვები და კონტენტი</h2>
                <p className="mt-2 leading-relaxed">
                  მომხმარებლებს შეუძლიათ დატოვონ მიმოხილვები და სხვა კონტენტი. თქვენ ინარჩუნებთ თქვენი კონტენტის საკუთრების უფლებას, მაგრამ აძლევთ activoo-ს ლიცენზიას მის გამოსაჩენად. თქვენ არ შეგიძლიათ გამოაქვეყნოთ ცრუ, შეურაცხმყოფელი, აგრესიული ან უკანონო კონტენტი.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">6. პირადი ცხოვრების დაცვა</h2>
                <p className="mt-2 leading-relaxed">
                  თქვენი პირადი ცხოვრების დაცვა ჩვენთვის მნიშვნელოვანია. გთხოვთ, გაეცნოთ ჩვენს{" "}
                  <Link to="/privacy" className="text-primary underline underline-offset-2">კონფიდენციალურობის პოლიტიკას</Link>{" "}
                  იმის გასაგებად, თუ როგორ ვაგროვებთ, ვიყენებთ და ვიცავთ თქვენს პირად ინფორმაციას.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">7. პასუხისმგებლობის შეზღუდვა</h2>
                <p className="mt-2 leading-relaxed">
                  activoo არ არის პასუხისმგებელი მომხმარებლებსა და სკოლებს შორის ურთიერთობებიდან წარმოქმნილ დავებზე, ზიანებზე ან ფინანსურ კარგვებზე. ჩვენ არ გარანტირებთ პლატფორმაზე განთავსებული რომელიმე წრის ან სკოლის ხარისხს, უსაფრთხოებასა და შესაფერისობას.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">8. ცვლილებები წესებში</h2>
                <p className="mt-2 leading-relaxed">
                  ჩვენ დროდადრო შეგვიძლია განვაახლოთ ეს წესები და პირობები. პლატფორმის გამოყენების გაგრძელება ცვლილებების შემდეგ ნიშნავს განახლებული პირობების მიღებას.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">9. კონტაქტი</h2>
                <p className="mt-2 leading-relaxed">
                  თუ გაქვთ კითხვები ამ წესებისა და პირობების შესახებ, გთხოვთ, დაგვიკავშირდეთ მისამართზე{" "}
                  <a href="mailto:support@activoo.ge" className="text-primary underline underline-offset-2">support@activoo.ge</a>.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
