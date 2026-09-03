import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — activoo" },
      { name: "description", content: "Learn how activoo collects, uses, and protects your personal information." },
      { property: "og:title", content: "Privacy Policy — activoo" },
      { property: "og:description", content: "Learn how activoo collects, uses, and protects your personal information." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function PrivacyPage() {
  const { lang } = useI18n();
  const isEn = lang === "en";

  return (
    <AppShell hideViewTabs>
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← {isEn ? "Back to home" : "მთავარზე დაბრუნება"}
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">
          {isEn ? "Privacy Policy" : "კონფიდენციალურობის პოლიტიკა"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isEn ? "Last updated: " : "ბოლო განახლება: "} {new Date().toLocaleDateString(isEn ? "en-US" : "ka-GE", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="mt-10 space-y-8 text-foreground/90">
          {isEn ? (
            <>
              <section>
                <h2 className="text-xl font-semibold">1. Information We Collect</h2>
                <p className="mt-2 leading-relaxed">
                  We collect information you provide directly to us, such as your name, email address, phone number, and any content you submit (e.g., reviews, school listings). We also collect usage data and device information to improve our services.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
                <p className="mt-2 leading-relaxed">
                  We use your information to provide, maintain, and improve activoo, to communicate with you, to process inquiries, and to personalize your experience. We may also use aggregated data for analytics and marketing purposes.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">3. Sharing of Information</h2>
                <p className="mt-2 leading-relaxed">
                  We do not sell your personal information. We may share information with schools or instructors when you contact them through our platform, and with service providers who assist us in operating activoo. We may also disclose information if required by law.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">4. Cookies and Tracking</h2>
                <p className="mt-2 leading-relaxed">
                  We use cookies and similar technologies to remember your preferences, understand how you use our site, and improve functionality. You can manage cookie preferences through your browser settings.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">5. Data Security</h2>
                <p className="mt-2 leading-relaxed">
                  We implement reasonable security measures to protect your personal information. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">6. Your Rights</h2>
                <p className="mt-2 leading-relaxed">
                  You have the right to access, correct, or delete your personal information. You may also object to or restrict certain processing. To exercise these rights, please contact us at{" "}
                  <a href="mailto:support@activoo.ge" className="text-primary underline underline-offset-2">support@activoo.ge</a>.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">7. Children's Privacy</h2>
                <p className="mt-2 leading-relaxed">
                  activoo is designed to help parents find activities for children. We do not knowingly collect personal information directly from children under 13. If you believe we have collected such information, please contact us immediately.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">8. Changes to This Policy</h2>
                <p className="mt-2 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on our website and updating the effective date.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">9. Contact Us</h2>
                <p className="mt-2 leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at{" "}
                  <a href="mailto:support@activoo.ge" className="text-primary underline underline-offset-2">support@activoo.ge</a>.
                </p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-xl font-semibold">1. ინფორმაცია, რომელსაც ვაგროვებთ</h2>
                <p className="mt-2 leading-relaxed">
                  ჩვენ ვაგროვებთ ინფორმაციას, რომელსაც თქვენ პირდაპირ გვაწვდით, როგორიცაა თქვენი სახელი, ელფოსტის მისამართი, ტელეფონის ნომერი და ნებისმიერი კონტენტი, რომელსაც აგზავნით (მაგ., მიმოხილვები, სკოლის განცხადებები). ჩვენ ასევე ვაგროვებთ გამოყენების მონაცემებსა და მოწყობილობის ინფორმაციას ჩვენი სერვისების გასაუმჯობესებლად.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">2. როგორ ვიყენებთ თქვენს ინფორმაციას</h2>
                <p className="mt-2 leading-relaxed">
                  ჩვენ ვიყენებთ თქვენს ინფორმაციას activoo-ს მისაწოდებლად, შესანარჩუნებლად და გასაუმჯობესებლად, თქვენთან კომუნიკაციისთვის, შეკვეთების დასამუშავებლად და თქვენი გამოცდილების პერსონალიზებისთვის. ჩვენ ასევე შეგვიძლია გამოვიყენოთ აგრეგირებული მონაცემები ანალიტიკისა და მარკეტინგის მიზნებით.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">3. ინფორმაციის გაზიარება</h2>
                <p className="mt-2 leading-relaxed">
                  ჩვენ არ ვყიდით თქვენს პირად ინფორმაციას. ჩვენ შეგვიძლია გავუზიაროთ ინფორმაცია სკოლებს ან ინსტრუქტორებს, როდესაც ჩვენი პლატფორმის საშუალებით უკავშირდებით მათ, ასევე სერვისის მომწოდებლებს, რომლებიც გვეხმარებიან activoo-ს მუშაობაში. ჩვენ ასევე შეგვიძლია გავამჟღავნოთ ინფორმაცია კანონის მოთხოვნის შემთხვევაში.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">4. ქუქი-ფაილები და თვალთვალი</h2>
                <p className="mt-2 leading-relaxed">
                  ჩვენ ვიყენებთ ქუქი-ფაილებსა და მსგავს ტექნოლოგიებს თქვენი პრეფერენციების დასამახსოვრებლად, იმის გასაგებად, თუ როგორ იყენებთ ჩვენს საიტს, და ფუნქციონალის გასაუმჯობესებლად. თქვენ შეგიძლიათ მართოთ ქუქი-ფაილების პარამეტრები თქვენი ბრაუზერის პარამეტრების მეშვეობით.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">5. მონაცემების უსაფრთხოება</h2>
                <p className="mt-2 leading-relaxed">
                  ჩვენ ვიყენებთ გონივრულ უსაფრთხოების ზომებს თქვენი პირადი ინფორმაციის დასაცავად. თუმცა, ინტერნეტით გადაცემის ან ელექტრონული შენახვის არც ერთი მეთოდი არ არის სრულად უსაფრთხო და ჩვენ ვერ გავძლევთ აბსოლუტური უსაფრთხოების გარანტიას.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">6. თქვენი უფლებები</h2>
                <p className="mt-2 leading-relaxed">
                  თქვენ გაქვთ უფლება მიიღოთ წვდომა, შეასწოროთ ან წაშალოთ თქვენი პირადი ინფორმაცია. თქვენ ასევე შეგიძლიათ აღუდგინოთ წინააღმდეგობა ან შეაზღუდოთ გარკვეული დამუშავება. ამ უფლებების გამოსაყენებლად გთხოვთ, დაგვიკავშირდეთ მისამართზე{" "}
                  <a href="mailto:support@activoo.ge" className="text-primary underline underline-offset-2">support@activoo.ge</a>.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">7. ბავშვების პირადი ცხოვრების დაცვა</h2>
                <p className="mt-2 leading-relaxed">
                  activoo შექმნილია მშობლების დასახმარებლად ბავშვებისთვის აქტივობების მოსაძებნად. ჩვენ ვერ გავიგებთ განზრახ, რომ 13 წლამდე ბავშვებისგან პირადი ინფორმაცია შეგვკრებინოს. თუ მიგვაჩნია, რომ ასეთი ინფორმაცია შეგვკრებინა, გთხოვთ, დაგვიკავშირდეთ დაუყოვნებლივ.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">8. ცვლილებები ამ პოლიტიკაში</h2>
                <p className="mt-2 leading-relaxed">
                  ჩვენ დროდადრო შეგვიძლია განვაახლოთ ეს კონფიდენციალურობის პოლიტიკა. ჩვენ შეგატყობინებთ მნიშვნელოვან ცვლილებებს ახალი პოლიტიკის ჩვენს ვებსაიტზე გამოქვეყნებისა და ძალაში შესვლის თარიღის განახლების გზით.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold">9. დაგვიკავშირდით</h2>
                <p className="mt-2 leading-relaxed">
                  თუ გაქვთ კითხვები ამ კონფიდენციალურობის პოლიტიკის შესახებ, გთხოვთ, დაგვიკავშირდეთ მისამართზე{" "}
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
