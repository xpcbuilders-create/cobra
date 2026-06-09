import { Link } from 'react-router-dom';

export function About() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8">
      
      {/* Heading */}
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold text-slate-900">
          About Our Company
        </h1>

        <p className="text-lg leading-relaxed text-slate-600">
          We are a modern technology and gaming-focused online store dedicated to
          delivering high-performance products, premium accessories, and reliable
          customer support. Our goal is to make powerful technology accessible,
          affordable, and easy to customize for everyone.
        </p>

        <p className="leading-relaxed text-slate-600">
          From gaming PCs and workstation builds to accessories and custom setups,
          we focus on quality, performance, and customer satisfaction. Every product
          is selected carefully to ensure reliability and long-term value.
        </p>
      </div>

      {/* Company Mission */}
      <div className="rounded-2xl bg-slate-100 p-6 shadow-sm">
        <h2 className="mb-3 text-2xl font-semibold text-slate-900">
          Our Mission
        </h2>

        <p className="leading-relaxed text-slate-600">
          Our mission is to build a trusted technology brand that helps gamers,
          creators, students, and professionals get the best performance from
          their systems. We believe technology should inspire creativity,
          productivity, and innovation.
        </p>
      </div>

      {/* Founders Section */}
      <div>
        <h2 className="mb-8 text-center text-3xl font-bold text-slate-900">
          Meet Our Team
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          
          {/* Founder */}
          <div className="rounded-2xl bg-white p-6 text-center shadow-md">
            <img
              src="./src/assets/IMG_20250510_200532_1.jpg              "
              alt="Founder"
              className="mx-auto mb-4 h-32 w-32 rounded-full border-4 border-indigo-500 object-cover"
            />

            <h3 className="text-xl font-semibold text-slate-900">
              Founder 
              VJ & Co.
            </h3>

            <p className="mt-2 text-slate-600">
              Visionary leader focused on innovation, gaming technology,
              and building a trusted customer-first brand.
            </p>
          </div>

          {/* Co-Founder */}
          <div className="rounded-2xl bg-white p-6 text-center shadow-md">
            <img
              src="./src/assets/image_ba0eb6d8.png "
              alt="Co-Founder"
              className="mx-auto mb-4 h-32 w-32 rounded-full border-4 border-indigo-500 object-cover"
            />

            <h3 className="text-xl font-semibold text-slate-900">
              Co-Founder 
            </h3>

            <p className="mt-2 text-slate-600">
              Handles operations, customer experience, and strategic growth
              to ensure smooth service and quality support.
            </p>
          </div>

          {/* Sponsor */}
          <div className="rounded-2xl bg-white p-6 text-center shadow-md">
            <img
              src="./src/assets/Screenshot_2026_0602_201352.png"
              alt="Sponsor"
              className="mx-auto mb-4 h-32 w-32 rounded-full border-4 border-indigo-500 object-cover"
            />

            <h3 className="text-xl font-semibold text-slate-900">
              Sponsored By
              COBRA STUDIO
            </h3>

            <p className="mt-2 text-slate-600">
              Supporting innovation, gaming communities, and next-generation
              technology solutions for enthusiasts and professionals.
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid gap-6 md:grid-cols-3">
        
        <div className="rounded-2xl bg-indigo-50 p-6 shadow-sm">
          <h3 className="mb-2 text-xl font-semibold text-indigo-700">
            High Quality Products
          </h3>

          <p className="text-slate-600">
            Carefully selected components and products for reliability,
            speed, and performance.
          </p>
        </div>

        <div className="rounded-2xl bg-indigo-50 p-6 shadow-sm">
          <h3 className="mb-2 text-xl font-semibold text-indigo-700">
            Custom PC Builds
          </h3>

          <p className="text-slate-600">
            Personalized gaming and workstation builds designed according
            to your requirements and budget.
          </p>
        </div>

        <div className="rounded-2xl bg-indigo-50 p-6 shadow-sm">
          <h3 className="mb-2 text-xl font-semibold text-indigo-700">
            Customer Support
          </h3>

          <p className="text-slate-600">
            Dedicated support team ready to help with product selection,
            orders, and technical assistance.
          </p>
        </div>
      </div>

      {/* Customize Section */}
      <div className="rounded-2xl bg-slate-900 p-8 text-center text-white">
        <h2 className="mb-4 text-3xl font-bold">
          Need a Custom Setup?
        </h2>

        <p className="mb-6 text-slate-300">
          Tell us your requirements and we will help you build the perfect
          gaming or professional setup for your needs.
        </p>

        <Link
          to="/customise"
          className="inline-block rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-700"
        >
          Go to Customise Page
        </Link>
      </div>
    </div>
  );
}