import { Disclosure, DisclosureButton } from '@headlessui/react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

const faqData = [
  {
    question: "What is the purpose of this website?",
    answer: "This website is useful when you want to sing a song but the pitch is too high or too low. With this tool, you can instantly adjust the pitch to your preference and also slow down or speed up the video to match your desired tempo."
  },
  {
    question: "Didn't a website like this already exist?",
    answer: "No, not with this speed and simplicity. Other websites usually require you to first download the video from YouTube, upload it, and then change the pitch, which slows down the process."
  },
  {
    question: "What technologies were used to develop this website?",
    answer: "This website was developed using React, with the help of Tone.js for the frontend, and Express with ytdl-core for the backend."
  },
];

const Faqs = () => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <div className="divide-y divide-white/5 rounded-xl bg-primary w-full max-w-2xl">
        {faqData.map((faq, index) => (
          <Disclosure as="div" className="p-6 w-full" key={index}>
            {({ open }) => (
              <>
                <DisclosureButton className="group flex w-full items-center justify-between">
                  <span className="text-sm text-left font-medium text-white group-hover:text-white/80 flex-grow">
                    {faq.question}
                  </span>
                  <Icon
                    icon="akar-icons:chevron-down"
                    width={24}
                    height={24}
                    className={`ml-2 flex-shrink-0 fill-white/60 group-hover:fill-white/50 ${open ? 'rotate-180' : ''}`}
                  />
                </DisclosureButton>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="mt-2 text-sm text-white/50">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </Disclosure>
        ))}
      </div>
    </motion.div>
  );
};

export default Faqs;