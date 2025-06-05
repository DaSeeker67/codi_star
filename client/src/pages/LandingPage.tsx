import { SignInButton } from '@clerk/clerk-react';

const features = [
  {
    title: 'AI-Powered Suggestions',
    description: 'Get real-time contextual code completions, explanations, and fixes powered by LLaMA 2 integration.',
    icon: (
      <svg className="h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    title: 'Collaborative Editing',
    description: 'Work together in real-time with WebSocket-powered multi-user sessions.',
    icon: (
      <svg className="h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20H4v-2a3 3 0 015.356-1.857" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a5 5 0 100-10 5 5 0 000 10z" />
      </svg>
    ),
  },
  {
    title: 'Integrated IDE Experience',
    description: 'Seamless Monaco Editor integration with syntax highlighting and file management.',
    icon: (
      <svg className="h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8m-8-4h8" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">Codi_Star</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#features" className="text-gray-700 hover:text-indigo-600">Features</a>
              {/* <a href="#pricing" className="text-gray-700 hover:text-indigo-600">Pricing</a> */}
              <a href="#" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"><SignInButton></SignInButton></a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-indigo-600 text-white">
        <div className="max-w-7xl mx-auto py-20 px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-4xl font-extrabold">Your AI-Powered Code Companion</h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto">
            Codi_Star integrates cutting-edge AI into your IDE, delivering contextual suggestions, fixes, and real-time collaboration—all in one place.
          </p>
          
          <a
            href="#"
            className="mt-8 inline-block px-6 py-3 bg-white text-indigo-600 font-medium rounded-md hover:bg-gray-100"
          >
          <SignInButton></SignInButton>
          </a>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-gray-800 text-center">Features</h3>
          <div className="mt-10 grid gap-8 grid-cols-1 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white p-6 rounded-lg shadow">
                <div>{feature.icon}</div>
                <h4 className="mt-4 text-xl font-semibold text-gray-800">{feature.title}</h4>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section id="pricing" className="bg-white py-16">
        <div className="max-w-md mx-auto text-center">
          <h3 className="text-2xl font-bold text-gray-800">Pricing</h3>
          <p className="mt-4 text-gray-600">
            Get started for free or upgrade to Pro for advanced features and priority AI usage.
          </p>
          <a
            href="#"
            className="mt-6 inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700"
          >
            View Plans
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between">
          <p>&copy; {new Date().getFullYear()} Codi_Star. All rights reserved.</p>
          <div className="space-x-4">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
